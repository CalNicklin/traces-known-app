import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema } from "./base";
import { Product } from "./product-schema";

export const ProductAISummary = appSchema.table(
  "product_ai_summary",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    productId: t
      .uuid()
      .notNull()
      .unique()
      .references(() => Product.id, { onDelete: "cascade" }),
    summary: t.text().notNull(),
    riskLevel: t.varchar({ length: 20 }).notNull(),
    confidence: t.real(),
    reportCount: t.integer().notNull(),
    modelVersion: t.varchar({ length: 50 }),
    createdAt: t.timestamp().defaultNow().notNull(),
    updatedAt: t.timestamp().defaultNow().notNull(),
  })
);

export const UpsertProductAISummarySchema = createInsertSchema(
  ProductAISummary,
  {
    productId: z.string().uuid(),
    summary: z.string().min(1).max(500),
    riskLevel: z.enum(["low", "moderate", "high", "unknown"]),
    confidence: z.number().min(0).max(1).optional(),
    reportCount: z.number().int().positive(),
    modelVersion: z.string().optional(),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const SelectProductAISummarySchema =
  createSelectSchema(ProductAISummary);

export type ProductAISummary = typeof ProductAISummary.$inferSelect;
export type ProductAISummaryInsert = typeof ProductAISummary.$inferInsert;
