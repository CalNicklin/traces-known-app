import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq, isNull, sql } from "@acme/db";
import {
  Product,
  ProductAISummary,
  Report,
  UpsertProductAISummarySchema,
} from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const aiSummaryRouter = {
  // Get AI summary for a product (used by UI)
  byProductId: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.ProductAISummary.findFirst({
        where: eq(ProductAISummary.productId, input.productId),
      });
      // TanStack Query v5 requires returning null instead of undefined
      return result ?? null;
    }),

  // Upsert AI summary (used by cron job)
  upsert: protectedProcedure
    .input(UpsertProductAISummarySchema)
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(ProductAISummary)
        .values({
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: ProductAISummary.productId,
          set: {
            summary: input.summary,
            riskLevel: input.riskLevel,
            confidence: input.confidence,
            reportCount: input.reportCount,
            modelVersion: input.modelVersion,
            updatedAt: new Date(),
          },
        })
        .returning();

      return result;
    }),

  // Get products needing summarization (used by cron job)
  getProductsToSummarize: protectedProcedure
    .input(
      z.object({
        minReports: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Products with >= minReports that either:
      // 1. Have no AI summary yet, OR
      // 2. Have new reports since last summary
      const products = await ctx.db
        .select({
          id: Product.id,
          name: Product.name,
          allergenWarning: Product.allergenWarning,
          reportCount: sql<number>`count(${Report.id})::int`,
          latestReportDate: sql<Date>`max(${Report.reportDate})`,
          summaryUpdatedAt: ProductAISummary.updatedAt,
        })
        .from(Product)
        .innerJoin(Report, eq(Report.productId, Product.id))
        .leftJoin(ProductAISummary, eq(ProductAISummary.productId, Product.id))
        .where(isNull(Report.deletedAt))
        .groupBy(Product.id, ProductAISummary.updatedAt)
        .having(sql`count(${Report.id}) >= ${input.minReports}`)
        .orderBy(desc(sql`max(${Report.reportDate})`))
        .limit(input.limit);

      // Filter to products needing update
      return products.filter(
        (p) =>
          !p.summaryUpdatedAt ||
          (p.latestReportDate && p.latestReportDate > p.summaryUpdatedAt),
      );
    }),
} satisfies TRPCRouterRecord;
