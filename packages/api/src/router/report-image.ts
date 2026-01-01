import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq } from "@acme/db";
import {
  CreateImageReportSchema,
  ImageReport,
  Report,
  ReportImage,
} from "@acme/db/schema";

import {
  createUploadUrl,
  deleteImage,
  processUploadedImage,
} from "../lib/storage";
import { protectedProcedure, publicProcedure } from "../trpc";

export const reportImageRouter = {
  /**
   * Request a presigned upload URL
   * Client will upload directly to Supabase Storage
   */
  requestUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await createUploadUrl(input.filename);
      return result;
    }),

  /**
   * Confirm upload and process the image
   * Called after client uploads to presigned URL
   */
  confirmUpload: protectedProcedure
    .input(
      z.object({
        tempPath: z.string().min(1),
        reportId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the report exists and belongs to the user
      const report = await ctx.db.query.Report.findFirst({
        where: and(
          eq(Report.id, input.reportId),
          eq(Report.userId, ctx.session.user.id),
        ),
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found or you do not have permission",
        });
      }

      // Process the image (download, optimize with Sharp, re-upload)
      const processed = await processUploadedImage(
        input.tempPath,
        input.reportId,
      );

      // Save to database
      const [image] = await ctx.db
        .insert(ReportImage)
        .values({
          reportId: input.reportId,
          storagePath: processed.storagePath,
          url: processed.url,
          status: "approved", // Skip moderation for now
          uploadedBy: ctx.session.user.id,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        })
        .returning();

      return image;
    }),

  /**
   * Get images for a product (from all reports)
   */
  byProductId: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all reports for this product, then get their images
      const reports = await ctx.db.query.Report.findMany({
        where: eq(Report.productId, input.productId),
        columns: { id: true },
      });

      if (reports.length === 0) {
        return [];
      }

      const reportIds = reports.map((r) => r.id);

      // Get all approved images for these reports
      const images = await ctx.db.query.ReportImage.findMany({
        where: and(
          eq(ReportImage.status, "approved"),
          // Use inArray for multiple report IDs
        ),
        orderBy: (images, { desc }) => [desc(images.createdAt)],
        with: {
          report: {
            columns: { id: true, productId: true },
          },
          uploader: {
            columns: { id: true, name: true, image: true },
          },
        },
      });

      // Filter to only images belonging to this product's reports
      return images.filter((img) => reportIds.includes(img.report.id));
    }),

  /**
   * Get images for a specific report
   */
  byReportId: publicProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.ReportImage.findMany({
        where: eq(ReportImage.reportId, input.reportId),
        orderBy: (images, { desc }) => [desc(images.createdAt)],
      });
    }),

  /**
   * Delete an image (owner only)
   */
  delete: protectedProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.query.ReportImage.findFirst({
        where: eq(ReportImage.id, input.imageId),
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      if (image.uploadedBy !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own images",
        });
      }

      // Delete from storage
      await deleteImage(image.storagePath);

      // Delete from database
      await ctx.db.delete(ReportImage).where(eq(ReportImage.id, input.imageId));

      return { success: true };
    }),

  /**
   * Report an image as inappropriate
   */
  reportImage: protectedProcedure
    .input(CreateImageReportSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify image exists
      const image = await ctx.db.query.ReportImage.findFirst({
        where: eq(ReportImage.id, input.imageId),
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      // Check for duplicate report
      const existingReport = await ctx.db.query.ImageReport.findFirst({
        where: and(
          eq(ImageReport.imageId, input.imageId),
          eq(ImageReport.reportedBy, ctx.session.user.id),
        ),
      });

      if (existingReport) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reported this image",
        });
      }

      // Create the report
      const [report] = await ctx.db
        .insert(ImageReport)
        .values({
          imageId: input.imageId,
          reportedBy: ctx.session.user.id,
          reason: input.reason,
          comment: input.comment,
        })
        .returning();

      // Flag the image for review
      await ctx.db
        .update(ReportImage)
        .set({ status: "flagged" })
        .where(eq(ReportImage.id, input.imageId));

      return report;
    }),
} satisfies TRPCRouterRecord;
