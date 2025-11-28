import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import {
  Allergen,
  CreateAllergenSchema,
  UserAllergen,
} from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const allergenRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.Allergen.findMany({
      orderBy: desc(Allergen.name),
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Allergen.findFirst({
        where: eq(Allergen.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(CreateAllergenSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Allergen).values(input);
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const userAllergens = await ctx.db.query.UserAllergen.findMany({
      where: eq(UserAllergen.userId, ctx.session.user.id),
      with: {
        allergen: true,
      },
    });

    return userAllergens.map((entry) => entry.allergen);
  }),

  saveMine: protectedProcedure
    .input(
      z.object({
        allergenIds: z.array(z.string().uuid()).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (trx) => {
        await trx
          .delete(UserAllergen)
          .where(eq(UserAllergen.userId, ctx.session.user.id));

        if (input.allergenIds.length === 0) {
          return;
        }

        await trx.insert(UserAllergen).values(
          input.allergenIds.map((allergenId) => ({
            allergenId,
            userId: ctx.session.user.id,
          })),
        );
      });

      return ctx.db.query.UserAllergen.findMany({
        where: eq(UserAllergen.userId, ctx.session.user.id),
        with: { allergen: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.delete(Allergen).where(eq(Allergen.id, input.id));
    }),
} satisfies TRPCRouterRecord;
