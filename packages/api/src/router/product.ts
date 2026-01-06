import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { SearchResultProduct } from "@acme/db/schema";
import { desc, eq, ilike, or, sql } from "@acme/db";
import {
  Product,
  ProductCategory,
  ProductFormSchema,
  ProductView,
  Report,
} from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const productRouter = {
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.Product.findMany({
      orderBy: desc(Product.name),
      limit: 50,
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.Product.findFirst({
        where: eq(Product.id, input.id),
      });
      return result ?? null;
    }),

  byBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.Product.findFirst({
        where: eq(Product.barcode, input.barcode),
      });
      return product ?? null;
    }),

  byName: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.query.Product.findMany({
        where: or(
          ilike(Product.name, `%${input.name}%`),
          ilike(Product.brand, `%${input.name}%`),
        ),
        limit: 24,
      });

      return products;
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const products = await ctx.db.query.Product.findMany({
        where: or(
          ilike(Product.name, `%${input.query}%`),
          ilike(Product.brand, `%${input.query}%`),
          eq(Product.barcode, input.query),
        ),
        limit: input.limit,
        offset,
        orderBy: desc(Product.createdAt),
      });

      // Transform to SearchResultProduct type
      const searchResults: SearchResultProduct[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        inDb: true, // All results from our DB are marked as inDb: true
      }));

      return searchResults;
    }),

  create: protectedProcedure
    .input(ProductFormSchema)
    .mutation(async ({ ctx, input }) => {
      // Extract categoryIds from input
      const { categoryIds, ...productData } = input;

      // Insert product first
      const [product] = await ctx.db
        .insert(Product)
        .values(productData)
        .returning();

      if (!product) {
        throw new Error("Failed to create product");
      }

      // Insert category associations
      if (categoryIds.length > 0) {
        await ctx.db.insert(ProductCategory).values(
          categoryIds.map((categoryId) => ({
            productId: product.id,
            categoryId,
          })),
        );
      }

      return product;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          barcode: z.string().max(50).optional(),
          allergenWarning: z.string().max(2000).optional(),
          ingredients: z.array(z.string()).optional(),
          imageUrl: z.string().url().max(500).optional().nullable(),
          brand: z.string().max(255).optional(),
        }),
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

  /** Get recently viewed products for the current user */
  recentlyViewed: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const views = await ctx.db.query.ProductView.findMany({
        where: eq(ProductView.userId, ctx.session.user.id),
        orderBy: desc(ProductView.viewedAt),
        limit: input?.limit ?? 10,
        with: {
          product: true,
        },
      });

      return views.map((view) => view.product);
    }),

  /** Get recently added products to the system */
  recentlyAdded: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.query.Product.findMany({
        orderBy: desc(Product.createdAt),
        limit: input?.limit ?? 10,
      });
    }),

  /** Get products the current user has reported allergies on */
  reportedByUser: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.query.Report.findMany({
        where: eq(Report.userId, ctx.session.user.id),
        orderBy: desc(Report.reportDate),
        limit: input?.limit ?? 20,
        with: {
          product: true,
        },
      });

      // Deduplicate products (user may have multiple reports on same product)
      const productMap = new Map<string, (typeof reports)[0]["product"]>();
      for (const report of reports) {
        if (!productMap.has(report.product.id)) {
          productMap.set(report.product.id, report.product);
        }
      }

      return Array.from(productMap.values());
    }),

  /** Record a product view (upsert - updates viewedAt if exists) */
  recordView: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(ProductView)
        .values({
          userId: ctx.session.user.id,
          productId: input.productId,
          viewedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [ProductView.userId, ProductView.productId],
          set: { viewedAt: sql`now()` },
        });
    }),
} satisfies TRPCRouterRecord;
