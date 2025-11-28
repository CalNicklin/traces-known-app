import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { db as DbInstance } from "@acme/db/client";
import type { SearchResultProduct } from "@acme/db/schema";
import { desc, eq, inArray, sql } from "@acme/db";
import {
  Allergen,
  CreateProductSchema,
  Product,
  ProductAISummarySchema,
  Report,
  ReportSeveritySchema,
} from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

type DatabaseClient = typeof DbInstance;

export const productRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.Product.findMany({
      orderBy: desc(Product.name),
      limit: 50,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Product.findFirst({
        where: eq(Product.id, input.id),
      });
    }),

  byBarcode: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Product.findFirst({
        where: eq(Product.barcode, input.barcode),
      });
    }),

  byName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const searchQuery = input.name.trim();
      if (!searchQuery) {
        return [];
      }

      // Use same fuzzy search as the main search endpoint
      const products = await ctx.db.execute<{
        id: string;
        name: string;
        barcode: string | null;
        allergen_warning: string | null;
        risk_level: string | null;
        ingredients: string[] | null;
        image_url: string | null;
        brand: string | null;
        created_at: Date;
        updated_at: Date | null;
        deleted_at: Date | null;
        ai_summary: unknown;
        ai_summary_updated_at: Date | null;
      }>(sql`
        SELECT *
        FROM app.product p
        WHERE 
          p.deleted_at IS NULL
          AND (
            to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.brand, '')) @@ plainto_tsquery('english', ${searchQuery})
            OR similarity(p.name, ${searchQuery}) > 0.1
            OR similarity(COALESCE(p.brand, ''), ${searchQuery}) > 0.2
          )
        ORDER BY similarity(p.name, ${searchQuery}) DESC
        LIMIT 24
      `);

      return products;
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const searchQuery = input.query.trim();

      if (!searchQuery) {
        return [];
      }

      // Use full-text search with trigram similarity for fuzzy matching
      // This finds "rice crackers" when searching for "rice cakes"
      const products = await ctx.db.execute<{
        id: string;
        name: string;
        barcode: string | null;
        image_url: string | null;
        rank: number;
      }>(sql`
        SELECT 
          p.id,
          p.name,
          p.barcode,
          p.image_url,
          (
            COALESCE(ts_rank(
              to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.brand, '')),
              plainto_tsquery('english', ${searchQuery})
            ), 0) * 2 +
            COALESCE(similarity(p.name, ${searchQuery}), 0) +
            COALESCE(similarity(COALESCE(p.brand, ''), ${searchQuery}), 0) * 0.5 +
            CASE WHEN p.barcode = ${searchQuery} THEN 10 ELSE 0 END
          ) as rank
        FROM app.product p
        WHERE 
          p.deleted_at IS NULL
          AND (
            to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.brand, '')) @@ plainto_tsquery('english', ${searchQuery})
            OR similarity(p.name, ${searchQuery}) > 0.1
            OR similarity(COALESCE(p.brand, ''), ${searchQuery}) > 0.2
            OR p.barcode = ${searchQuery}
          )
        ORDER BY rank DESC
        LIMIT ${input.limit}
        OFFSET ${offset}
      `);

      const searchResults: SearchResultProduct[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        imageUrl: product.image_url,
        inDb: true,
      }));

      return searchResults;
    }),

  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Product).values(input);
    }),

  detail: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.Product.findFirst({
        where: eq(Product.id, input.id),
      });

      if (!product) {
        return null;
      }

      const reports = await ctx.db.query.Report.findMany({
        where: eq(Report.productId, input.id),
        columns: {
          id: true,
          allergenIds: true,
          severity: true,
          reportDate: true,
        },
      });

      const stats = await buildProductStats(
        ctx.db,
        reports.map((report) => ({
          allergenIds: report.allergenIds,
          severity: report.severity as z.infer<typeof ReportSeveritySchema>,
          reportDate: report.reportDate,
        })),
      );

      return { product, stats };
    }),

  upsertSummary: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        summary: ProductAISummarySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(Product)
        .set({
          aiSummary: input.summary,
          aiSummaryUpdatedAt: new Date(),
        })
        .where(eq(Product.id, input.productId));

      return ctx.db.query.Product.findFirst({
        where: eq(Product.id, input.productId),
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: CreateProductSchema.partial(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db
        .update(Product)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(Product.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.delete(Product).where(eq(Product.id, input.id));
    }),
} satisfies TRPCRouterRecord;

type ReportForStats = {
  allergenIds: string[] | null;
  severity: z.infer<typeof ReportSeveritySchema>;
  reportDate: Date;
};

async function buildProductStats(
  db: DatabaseClient,
  reports: ReportForStats[],
) {
  const totalReports = reports.length;

  const severityBuckets: Record<
    z.infer<typeof ReportSeveritySchema>,
    number
  > = {
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    UNKNOWN: 0,
  };

  const allergenCounts = new Map<string, number>();
  let lastReportedAt: Date | null = null;

  for (const report of reports) {
    severityBuckets[report.severity] =
      (severityBuckets[report.severity] ?? 0) + 1;
    if (report.allergenIds) {
      for (const allergenId of report.allergenIds) {
        allergenCounts.set(
          allergenId,
          (allergenCounts.get(allergenId) ?? 0) + 1,
        );
      }
    }
    if (!lastReportedAt || report.reportDate > lastReportedAt) {
      lastReportedAt = report.reportDate;
    }
  }

  const allergenDetails = allergenCounts.size
    ? await db.query.Allergen.findMany({
        where: inArray(Allergen.id, Array.from(allergenCounts.keys())),
        columns: {
          id: true,
          name: true,
        },
      })
    : [];

  const allergenMentions = allergenDetails
    .map((allergen) => ({
      allergenId: allergen.id,
      allergenName: allergen.name,
      count: allergenCounts.get(allergen.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalReports,
    severityBreakdown: severityBuckets,
    allergenMentions,
    lastReportedAt,
  };
}
