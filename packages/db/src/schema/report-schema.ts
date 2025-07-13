import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema } from "./base";

export const Report = appSchema.table("report", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t.varchar({ length: 255 }).notNull(),
  productId: t.uuid().notNull(),
  allergenIds: t.uuid().array(),
  comment: t.text(),
  reportDate: t.timestamp().defaultNow().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const ReportAllergen = appSchema.table("report_allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  reportId: t
    .uuid()
    .notNull()
    .references(() => Report.id),
  allergenId: t.uuid().notNull(),
}));

// Relations
export const ReportRelations = relations(Report, ({ many }) => ({
  reportAllergens: many(ReportAllergen),
}));

export const ReportAllergenRelations = relations(ReportAllergen, ({ one }) => ({
  report: one(Report, {
    fields: [ReportAllergen.reportId],
    references: [Report.id],
  }),
}));

// Schemas
export const CreateReportSchema = createInsertSchema(Report, {
  userId: z.string().max(255),
  productId: z.string().uuid(),
  allergenIds: z.array(z.string().uuid()).optional(),
  comment: z.string().optional(),
}).omit({
  id: true,
  reportDate: true,
  createdAt: true,
});

export const SelectReportSchema = createSelectSchema(Report);
export const SelectReportAllergenSchema = createSelectSchema(ReportAllergen);
