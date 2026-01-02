import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Product } from "./product-schema";

/**
 * Product images uploaded during product creation.
 * Separate from ReportImage which is for allergy reaction evidence.
 */
export const ProductImage = appSchema.table("product_image", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  productId: t
    .uuid()
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
  storagePath: t.varchar({ length: 500 }).notNull(),
  url: t.varchar({ length: 1000 }).notNull(),
  width: t.integer(),
  height: t.integer(),
  sizeBytes: t.integer(),
  uploadedBy: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// Zod Schemas
export const CreateProductImageSchema = createInsertSchema(ProductImage, {
  productId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
  url: z.string().url().max(1000),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
}).omit({
  id: true,
  uploadedBy: true,
  createdAt: true,
});

export const SelectProductImageSchema = createSelectSchema(ProductImage);
