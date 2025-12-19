import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { Allergen } from "./allergen-schema";
import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Product } from "./product-schema";

export const Report = appSchema.table("report", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: t
    .uuid()
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
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
    .references(() => Report.id, { onDelete: "cascade" }),
  allergenId: t
    .uuid()
    .notNull()
    .references(() => Allergen.id, { onDelete: "cascade" }),
}));

// Relations are defined in relations.ts to avoid duplicate definitions

// Schemas
export const CreateReportSchema = createInsertSchema(Report, {
  productId: z.string().uuid(),
  allergenIds: z.array(z.string().uuid()).optional(),
  comment: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  reportDate: true,
  createdAt: true,
});

export const SelectReportSchema = createSelectSchema(Report);
export const SelectReportAllergenSchema = createSelectSchema(ReportAllergen);
