import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, count, desc, eq } from "@acme/db";
import { Notification } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const notificationRouter = {
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          unreadOnly: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const unreadOnly = input?.unreadOnly ?? false;

      const whereClause = unreadOnly
        ? and(
            eq(Notification.userId, ctx.session.user.id),
            eq(Notification.isRead, false),
          )
        : eq(Notification.userId, ctx.session.user.id);

      const notifications = await ctx.db.query.Notification.findMany({
        where: whereClause,
        orderBy: [desc(Notification.createdAt)],
        limit: limit + 1,
        offset,
        with: {
          actor: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
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
          comment: {
            columns: {
              id: true,
              content: true,
            },
          },
        },
      });

      const hasMore = notifications.length > limit;
      const items = hasMore ? notifications.slice(0, limit) : notifications;

      return {
        items,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: count() })
      .from(Notification)
      .where(
        and(
          eq(Notification.userId, ctx.session.user.id),
          eq(Notification.isRead, false),
        ),
      );

    return result[0]?.count ?? 0;
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(Notification)
        .set({ isRead: true })
        .where(
          and(
            eq(Notification.id, input.id),
            eq(Notification.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(Notification)
      .set({ isRead: true })
      .where(
        and(
          eq(Notification.userId, ctx.session.user.id),
          eq(Notification.isRead, false),
        ),
      );

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
