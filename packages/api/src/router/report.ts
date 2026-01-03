import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, isNull } from "@acme/db";
import {
  CreateReportSchema,
  Report,
  UpdateReportSchema,
} from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const reportRouter = {
  byProductId: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.query.Report.findMany({
        where: and(
          eq(Report.productId, input.productId),
          isNull(Report.deletedAt),
        ),
        orderBy: (reports, { desc }) => [desc(reports.reportDate)],
        limit: 50,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return reports;
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.query.Report.findFirst({
        where: and(eq(Report.id, input.id), isNull(Report.deletedAt)),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          product: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      return report ?? null;
    }),

  myReports: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const reports = await ctx.db.query.Report.findMany({
        where: and(
          eq(Report.userId, ctx.session.user.id),
          isNull(Report.deletedAt),
        ),
        orderBy: [desc(Report.reportDate)],
        limit: limit + 1, // Fetch one extra to check if there are more
        offset,
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              brand: true,
            },
          },
        },
      });

      const hasMore = reports.length > limit;
      const items = hasMore ? reports.slice(0, limit) : reports;

      return {
        items,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      };
    }),

  create: protectedProcedure
    .input(CreateReportSchema)
    .mutation(async ({ ctx, input }) => {
      const [report] = await ctx.db
        .insert(Report)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();
      return report;
    }),

  update: protectedProcedure
    .input(UpdateReportSchema)
    .mutation(async ({ ctx, input }) => {
      // First verify ownership
      const existing = await ctx.db.query.Report.findFirst({
        where: and(eq(Report.id, input.id), isNull(Report.deletedAt)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own reports",
        });
      }

      const [updated] = await ctx.db
        .update(Report)
        .set({
          comment: input.comment,
          updatedAt: new Date(),
        })
        .where(eq(Report.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First verify ownership
      const existing = await ctx.db.query.Report.findFirst({
        where: and(eq(Report.id, input.id), isNull(Report.deletedAt)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own reports",
        });
      }

      // Soft delete
      await ctx.db
        .update(Report)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(Report.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
