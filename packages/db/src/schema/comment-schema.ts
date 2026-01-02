import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Report } from "./report-schema";

export const ReportComment = appSchema.table("report_comment", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  reportId: t
    .uuid()
    .notNull()
    .references(() => Report.id, { onDelete: "cascade" }),
  userId: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentCommentId: t.uuid(), // Self-reference - can't use references() here due to circular dep
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp(),
  deletedAt: t.timestamp(),
}));

// Schemas
export const CreateReportCommentSchema = createInsertSchema(ReportComment, {
  reportId: z.string().uuid(),
  parentCommentId: z.string().uuid().optional(),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const UpdateReportCommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const SelectReportCommentSchema = createSelectSchema(ReportComment);

export type ReportComment = typeof ReportComment.$inferSelect;
export type ReportCommentInsert = typeof ReportComment.$inferInsert;
