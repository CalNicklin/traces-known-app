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
        columns: {
          id: true,
          comment: true,
          reportDate: true,
          allergenIds: true,
          severity: true,
          symptoms: true,
        },
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

  latest: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.query.Report.findMany({
        orderBy: (table, operators) => [
          operators.desc(table.reportDate),
        ],
        limit: input.limit,
        with: {
          product: true,
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

  mine: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.query.Report.findMany({
        where: eq(Report.userId, ctx.session.user.id),
        orderBy: (table, operators) => [
          operators.desc(table.reportDate),
        ],
        limit: input.limit,
        with: {
          product: true,
        },
      });

      return reports;
    }),

  create: protectedProcedure
    .input(CreateReportSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Report).values({
        ...input,
        userId: ctx.session.user.id,
        severity: input.severity ?? "UNKNOWN",
        symptoms: input.symptoms,
      });
    }),
} satisfies TRPCRouterRecord;
