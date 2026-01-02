import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, isNull } from "@acme/db";
import {
  CreateReportCommentSchema,
  Notification,
  Report,
  ReportComment,
  UpdateReportCommentSchema,
} from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const commentRouter = {
  byReportId: publicProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.query.ReportComment.findMany({
        where: and(
          eq(ReportComment.reportId, input.reportId),
          isNull(ReportComment.deletedAt),
        ),
        orderBy: [desc(ReportComment.createdAt)],
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

      return comments;
    }),

  myComments: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const comments = await ctx.db.query.ReportComment.findMany({
        where: and(
          eq(ReportComment.userId, ctx.session.user.id),
          isNull(ReportComment.deletedAt),
        ),
        orderBy: [desc(ReportComment.createdAt)],
        limit: limit + 1,
        offset,
        with: {
          report: {
            columns: {
              id: true,
              productId: true,
            },
            with: {
              product: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const hasMore = comments.length > limit;
      const items = hasMore ? comments.slice(0, limit) : comments;

      return {
        items,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      };
    }),

  create: protectedProcedure
    .input(CreateReportCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify the report exists and is not deleted
      const report = await ctx.db.query.Report.findFirst({
        where: and(eq(Report.id, input.reportId), isNull(Report.deletedAt)),
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      // If replying to a comment, verify parent exists
      if (input.parentCommentId) {
        const parentComment = await ctx.db.query.ReportComment.findFirst({
          where: and(
            eq(ReportComment.id, input.parentCommentId),
            isNull(ReportComment.deletedAt),
          ),
        });

        if (!parentComment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          });
        }
      }

      // Create the comment
      const [comment] = await ctx.db
        .insert(ReportComment)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      // Create notification for the appropriate user
      // Don't notify if user is commenting on their own report/comment
      if (input.parentCommentId) {
        // Replying to a comment - notify the comment author
        const parentComment = await ctx.db.query.ReportComment.findFirst({
          where: eq(ReportComment.id, input.parentCommentId),
          columns: { userId: true },
        });

        if (parentComment && parentComment.userId !== ctx.session.user.id) {
          await ctx.db.insert(Notification).values({
            userId: parentComment.userId,
            actorId: ctx.session.user.id,
            type: "reply_to_comment",
            reportId: input.reportId,
            commentId: comment?.id,
          });
        }
      } else {
        // Replying to a report - notify the report author
        if (report.userId !== ctx.session.user.id) {
          await ctx.db.insert(Notification).values({
            userId: report.userId,
            actorId: ctx.session.user.id,
            type: "reply_to_report",
            reportId: input.reportId,
            commentId: comment?.id,
          });
        }
      }

      return comment;
    }),

  update: protectedProcedure
    .input(UpdateReportCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.query.ReportComment.findFirst({
        where: and(
          eq(ReportComment.id, input.id),
          isNull(ReportComment.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      const [updated] = await ctx.db
        .update(ReportComment)
        .set({
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(ReportComment.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.query.ReportComment.findFirst({
        where: and(
          eq(ReportComment.id, input.id),
          isNull(ReportComment.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments",
        });
      }

      // Soft delete
      await ctx.db
        .update(ReportComment)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(ReportComment.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
