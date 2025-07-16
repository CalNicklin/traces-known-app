import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import type { SearchResultProduct } from "@acme/db/schema";
import { desc, eq, ilike, or } from "@acme/db";
import { CreateProductSchema, Product } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

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
      const products = await ctx.db.query.Product.findMany({
        where: or(
          ilike(Product.name, `%${input.name}%`),
          ilike(Product.brand, `%${input.name}%`),
        ),
        limit: 24,
      });

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
    .input(CreateProductSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Product).values(input);
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
