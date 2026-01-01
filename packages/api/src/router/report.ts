import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@acme/db";
import { CreateReportSchema, Report } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const reportRouter = {
  byProductId: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.query.Report.findMany({
        where: eq(Report.productId, input.productId),
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
} satisfies TRPCRouterRecord;
