import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema, timestamps } from "./base";

export const Product = appSchema.table("product", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 255 }).notNull(),
  barcode: t.varchar({ length: 50 }).unique(),
  allergenWarning: t.text(),
  riskLevel: t.varchar({ length: 50 }),
  ingredients: t.text().array(),
  imageUrl: t.varchar({ length: 500 }),
  brand: t.varchar({ length: 255 }),
  aiSummary: t.jsonb("ai_summary").$type<ProductAISummary>(),
  aiSummaryUpdatedAt: t.timestamp("ai_summary_updated_at"),
  ...timestamps,
}));

export const ProductAISummarySchema = z.object({
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  highlights: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  sampleSize: z.number().int().nonnegative().optional(),
});

export type ProductAISummary = z.infer<typeof ProductAISummarySchema>;

// Schemas for database operations
export const CreateProductSchema = createInsertSchema(Product, {
  name: z.string().min(1, "Product name is required").max(255),
  barcode: z.string().max(50).optional(),
  allergenWarning: z.string().optional(),
  riskLevel: z.string().max(50).optional(),
  ingredients: z.array(z.string()).optional(),
  imageUrl: z.string().url().max(500).optional(),
  brand: z.string().max(255).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  aiSummary: true,
  aiSummaryUpdatedAt: true,
});

export const SelectProductSchema = createSelectSchema(Product);

// Form schema for user input (more lenient validation)
export const ProductFormSchema = createInsertSchema(Product, {
  name: z.string().min(1, "Product name is required").max(255),
  barcode: z.string().max(50).optional().or(z.literal("")),
  allergenWarning: z.string().optional().or(z.literal("")),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ingredients: z.array(z.string()).optional(),
  imageUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  brand: z.string().max(255).optional().or(z.literal("")),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Search result type
export interface SearchResultProduct {
  id: string;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
  inDb: boolean;
}
