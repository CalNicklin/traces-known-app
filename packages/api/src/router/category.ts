import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { count, desc, eq } from "@acme/db";
import {
  Category,
  CreateCategorySchema,
  Product,
  ProductCategory,
} from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const categoryRouter = {
  /** Get all categories with product counts */
  all: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.query.Category.findMany({
      orderBy: desc(Category.name),
    });

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const [result] = await ctx.db
          .select({ count: count() })
          .from(ProductCategory)
          .where(eq(ProductCategory.categoryId, category.id));

        return {
          ...category,
          productCount: result?.count ?? 0,
        };
      }),
    );

    return categoriesWithCounts;
  }),

  /** Get category by slug */
  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.Category.findFirst({
        where: eq(Category.slug, input.slug),
      });
      return result ?? null;
    }),

  /** Get products by category slug with pagination */
  productsBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      // Get category by slug
      const category = await ctx.db.query.Category.findFirst({
        where: eq(Category.slug, input.slug),
      });

      if (!category) {
        return {
          category: null,
          products: [],
          totalCount: 0,
          page: input.page,
          limit: input.limit,
          totalPages: 0,
        };
      }

      // Get products in this category with pagination
      const products = await ctx.db
        .select({
          id: Product.id,
          name: Product.name,
          barcode: Product.barcode,
          imageUrl: Product.imageUrl,
          brand: Product.brand,
          riskLevel: Product.riskLevel,
          createdAt: Product.createdAt,
        })
        .from(Product)
        .innerJoin(ProductCategory, eq(ProductCategory.productId, Product.id))
        .where(eq(ProductCategory.categoryId, category.id))
        .orderBy(desc(Product.createdAt))
        .limit(input.limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await ctx.db
        .select({ count: count() })
        .from(ProductCategory)
        .where(eq(ProductCategory.categoryId, category.id));

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / input.limit);

      return {
        category,
        products,
        totalCount,
        page: input.page,
        limit: input.limit,
        totalPages,
      };
    }),

  /** Get category by ID */
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.Category.findFirst({
        where: eq(Category.id, input.id),
      });
      return result ?? null;
    }),

  /** Create a new category (admin only in future) */
  create: protectedProcedure
    .input(CreateCategorySchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Category).values(input).returning();
    }),

  /** Assign a product to a category */
  assignProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        categoryId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Use upsert pattern - insert or do nothing if exists
      return ctx.db
        .insert(ProductCategory)
        .values({
          productId: input.productId,
          categoryId: input.categoryId,
        })
        .onConflictDoNothing();
    }),

  /** Remove a product from a category */
  removeProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        categoryId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(ProductCategory)
        .where(eq(ProductCategory.categoryId, input.categoryId));
    }),
} satisfies TRPCRouterRecord;
