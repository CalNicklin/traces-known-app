import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { appSchema } from "./base";
import { Product } from "./product-schema";

export const Allergen = appSchema.table("allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 255 }).notNull().unique(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const ProductAllergen = appSchema.table("product_allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  productId: t
    .uuid()
    .notNull()
    .references(() => Product.id, { onDelete: "cascade" }),
  allergenId: t
    .uuid()
    .notNull()
    .references(() => Allergen.id, { onDelete: "cascade" }),
}));

export const UserAllergen = appSchema.table("user_allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .varchar({ length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  allergenId: t
    .uuid()
    .notNull()
    .references(() => Allergen.id, { onDelete: "cascade" }),
}));

// Relations are defined in relations.ts to avoid duplicate definitions

// Schemas
export const CreateAllergenSchema = createInsertSchema(Allergen, {
  name: z.string().max(255),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectAllergenSchema = createSelectSchema(Allergen);
export const SelectProductAllergenSchema = createSelectSchema(ProductAllergen);
export const SelectUserAllergenSchema = createSelectSchema(UserAllergen);
