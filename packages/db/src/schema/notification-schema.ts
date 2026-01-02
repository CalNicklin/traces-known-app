import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { ReportComment } from "./comment-schema";
import { Report } from "./report-schema";

// Notification types as a const for type safety
export const NOTIFICATION_TYPES = {
  REPLY_TO_REPORT: "reply_to_report",
  REPLY_TO_COMMENT: "reply_to_comment",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const Notification = appSchema.table("notification", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  actorId: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: t.text().notNull(), // 'reply_to_report' | 'reply_to_comment'
  reportId: t
    .uuid()
    .notNull()
    .references(() => Report.id, { onDelete: "cascade" }),
  commentId: t.uuid().references(() => ReportComment.id, {
    onDelete: "cascade",
  }),
  isRead: t.boolean().notNull().default(false),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// Schemas
export const CreateNotificationSchema = createInsertSchema(Notification, {
  userId: z.string(),
  actorId: z.string(),
  type: z.enum(["reply_to_report", "reply_to_comment"]),
  reportId: z.string().uuid(),
  commentId: z.string().uuid().optional(),
}).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const SelectNotificationSchema = createSelectSchema(Notification);

export type Notification = typeof Notification.$inferSelect;
export type NotificationInsert = typeof Notification.$inferInsert;
