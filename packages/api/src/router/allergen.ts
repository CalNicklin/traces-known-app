import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { Allergen, CreateAllergenSchema } from "@acme/db/schema";

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

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.delete(Allergen).where(eq(Allergen.id, input.id));
    }),
} satisfies TRPCRouterRecord;
