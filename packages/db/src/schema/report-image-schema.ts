import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Report } from "./report-schema";

/**
 * Image status lifecycle:
 * - pending: Uploaded to temp, awaiting processing
 * - processing: Being optimized by Sharp
 * - approved: Live and visible
 * - flagged: Under review (moderation)
 * - rejected: Removed, not visible
 */
export const imageStatusEnum = appSchema.enum("image_status", [
  "pending",
  "processing",
  "approved",
  "flagged",
  "rejected",
]);

/**
 * Images uploaded with product reports
 */
export const ReportImage = appSchema.table("report_image", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  reportId: t
    .uuid()
    .notNull()
    .references(() => Report.id, { onDelete: "cascade" }),
  storagePath: t.varchar({ length: 500 }).notNull(),
  url: t.varchar({ length: 1000 }).notNull(),
  status: imageStatusEnum().default("pending").notNull(),
  moderationScore: t.numeric({ precision: 5, scale: 4 }),
  moderationLabels: t.jsonb(),
  uploadedBy: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  width: t.integer(),
  height: t.integer(),
  sizeBytes: t.integer(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

/**
 * User reports of inappropriate images
 */
export const ImageReport = appSchema.table("image_report", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  imageId: t
    .uuid()
    .notNull()
    .references(() => ReportImage.id, { onDelete: "cascade" }),
  reportedBy: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: t.varchar({ length: 50 }).notNull(), // 'inappropriate', 'wrong_product', 'spam', 'other'
  comment: t.text(),
  resolved: t.boolean().default(false).notNull(),
  resolvedBy: t.varchar({ length: 255 }).references(() => user.id),
  resolvedAt: t.timestamp(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// Relations are defined in relations.ts to avoid duplicate definitions

// Zod Schemas
export const CreateReportImageSchema = createInsertSchema(ReportImage, {
  reportId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
  url: z.string().url().max(1000),
  status: z.enum(["pending", "processing", "approved", "flagged", "rejected"]),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
}).omit({
  id: true,
  uploadedBy: true,
  moderationScore: true,
  moderationLabels: true,
  createdAt: true,
});

export const SelectReportImageSchema = createSelectSchema(ReportImage);

export const CreateImageReportSchema = createInsertSchema(ImageReport, {
  imageId: z.string().uuid(),
  reason: z.enum(["inappropriate", "wrong_product", "spam", "other"]),
  comment: z.string().max(500).optional(),
}).omit({
  id: true,
  reportedBy: true,
  resolved: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
});

export const SelectImageReportSchema = createSelectSchema(ImageReport);
