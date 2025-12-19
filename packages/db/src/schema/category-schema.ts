import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema, timestamps } from "./base";
import { Product } from "./product-schema";

export const Category = appSchema.table("category", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 255 }).notNull().unique(),
  slug: t.varchar({ length: 255 }).notNull().unique(),
  icon: t.varchar({ length: 100 }), // Radix icon name, e.g. "CookieIcon"
  ...timestamps,
}));

export const ProductCategory = appSchema.table(
  "product_category",
  (t) => ({
    productId: t
      .uuid()
      .notNull()
      .references(() => Product.id, { onDelete: "cascade" }),
    categoryId: t
      .uuid()
      .notNull()
      .references(() => Category.id, { onDelete: "cascade" }),
  }),
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

// Schemas for database operations
export const CreateCategorySchema = createInsertSchema(Category, {
  name: z.string().min(1, "Category name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  icon: z.string().max(100).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const SelectCategorySchema = createSelectSchema(Category);
export const SelectProductCategorySchema = createSelectSchema(ProductCategory);

