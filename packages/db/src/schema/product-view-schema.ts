import { unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Product } from "./product-schema";

export const ProductView = appSchema.table(
  "product_view",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: t
      .uuid()
      .notNull()
      .references(() => Product.id, { onDelete: "cascade" }),
    viewedAt: t.timestamp().defaultNow().notNull(),
  }),
  (t) => [unique().on(t.userId, t.productId)],
);

// Schemas for database operations
export const CreateProductViewSchema = createInsertSchema(ProductView, {
  productId: z.string().uuid(),
}).omit({
  id: true,
  userId: true,
  viewedAt: true,
});

export const SelectProductViewSchema = createSelectSchema(ProductView);

