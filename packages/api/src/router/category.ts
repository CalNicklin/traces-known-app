import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { count, desc, eq } from "@acme/db";
import {
  Category,
  CreateCategorySchema,
  ProductCategory,
} from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const categoryRouter = {
  /** Get all categories with product counts */
  all: publicProcedure.query(async ({ ctx }) => {
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
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Category.findFirst({
        where: eq(Category.slug, input.slug),
      });
    }),

  /** Get category by ID */
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Category.findFirst({
        where: eq(Category.id, input.id),
      });
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
