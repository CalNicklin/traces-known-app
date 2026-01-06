import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { Allergen, CreateAllergenSchema, UserAllergen } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const allergenRouter = {
  all: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.query.Allergen.findMany({
      orderBy: desc(Allergen.name),
    });
    return {
      items,
      emptyMessage:
        items.length === 0
          ? "No allergens are available yet. Please check back later or contact support."
          : undefined,
    };
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.Allergen.findFirst({
        where: eq(Allergen.id, input.id),
      });
      return result ?? null;
    }),

  create: protectedProcedure
    .input(CreateAllergenSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Allergen).values(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.delete(Allergen).where(eq(Allergen.id, input.id));
    }),

  myAllergens: protectedProcedure.query(async ({ ctx }) => {
    const userAllergens = await ctx.db.query.UserAllergen.findMany({
      where: eq(UserAllergen.userId, ctx.session.user.id),
      with: { allergen: true },
    });
    const items = userAllergens.map((ua) => ua.allergen);
    return {
      items,
      emptyMessage:
        items.length === 0
          ? "You haven't added any allergens to your profile yet. Select from all allergens below, or add your allergens in your profile settings for quicker access."
          : undefined,
    };
  }),
} satisfies TRPCRouterRecord;
