import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq } from "@acme/db";
import {
  CreateImageReportSchema,
  ImageReport,
  Product,
  ProductImage,
  Report,
  ReportImage,
} from "@acme/db/schema";

import { createUploadUrl, deleteImage, processImage } from "../lib/storage";
import { protectedProcedure } from "../trpc";

// Entity types for image uploads
const EntityTypeSchema = z.enum(["product", "report"]);
type EntityType = z.infer<typeof EntityTypeSchema>;

export const imageRouter = {
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
        entityType: EntityTypeSchema,
        entityId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, tempPath } = input;

      // Validate entity exists and user has permission
      if (entityType === "report") {
        const report = await ctx.db.query.Report.findFirst({
          where: and(
            eq(Report.id, entityId),
            eq(Report.userId, ctx.session.user.id),
          ),
        });

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found or you do not have permission",
          });
        }
      } else if (entityType === "product") {
        const product = await ctx.db.query.Product.findFirst({
          where: eq(Product.id, entityId),
        });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
      }

      // Process the image (download, optimize with Sharp, re-upload)
      const processed = await processImage(tempPath, entityType, entityId);

      // Save to appropriate database table
      if (entityType === "report") {
        const [image] = await ctx.db
          .insert(ReportImage)
          .values({
            reportId: entityId,
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
      } else {
        const [image] = await ctx.db
          .insert(ProductImage)
          .values({
            productId: entityId,
            storagePath: processed.storagePath,
            url: processed.url,
            uploadedBy: ctx.session.user.id,
            width: processed.width,
            height: processed.height,
            sizeBytes: processed.sizeBytes,
          })
          .returning();

        // Also update the product's imageUrl for convenience
        if (image) {
          await ctx.db
            .update(Product)
            .set({ imageUrl: processed.url, updatedAt: new Date() })
            .where(eq(Product.id, entityId));
        }

        return image;
      }
    }),

  /**
   * Get images by entity
   */
  byEntity: protectedProcedure
    .input(
      z.object({
        entityType: EntityTypeSchema,
        entityId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { entityType, entityId } = input;

      if (entityType === "report") {
        return ctx.db.query.ReportImage.findMany({
          where: eq(ReportImage.reportId, entityId),
          orderBy: (images, { desc }) => [desc(images.createdAt)],
        });
      } else {
        // For products, return single image (or could be array if we support gallery later)
        const image = await ctx.db.query.ProductImage.findFirst({
          where: eq(ProductImage.productId, entityId),
        });
        return image ? [image] : [];
      }
    }),

  /**
   * Get report images for a product (from all reports)
   */
  reportImagesByProductId: protectedProcedure
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
        where: eq(ReportImage.status, "approved"),
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
   * Delete an image (owner only)
   */
  delete: protectedProcedure
    .input(
      z.object({
        entityType: EntityTypeSchema,
        imageId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { entityType, imageId } = input;

      if (entityType === "report") {
        const image = await ctx.db.query.ReportImage.findFirst({
          where: eq(ReportImage.id, imageId),
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

        await deleteImage(image.storagePath);
        await ctx.db.delete(ReportImage).where(eq(ReportImage.id, imageId));
      } else {
        const image = await ctx.db.query.ProductImage.findFirst({
          where: eq(ProductImage.id, imageId),
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

        await deleteImage(image.storagePath);
        await ctx.db.delete(ProductImage).where(eq(ProductImage.id, imageId));

        // Clear the product's imageUrl
        await ctx.db
          .update(Product)
          .set({ imageUrl: null, updatedAt: new Date() })
          .where(eq(Product.id, image.productId));
      }

      return { success: true };
    }),

  /**
   * Report an image as inappropriate (report images only)
   */
  reportInappropriate: protectedProcedure
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
