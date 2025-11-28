import { relations } from "drizzle-orm";
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

// Relations
export const AllergenRelations = relations(Allergen, ({ many }) => ({
  productAllergens: many(ProductAllergen),
  userAllergens: many(UserAllergen),
}));

export const UserAllergenRelations = relations(UserAllergen, ({ one }) => ({
  allergen: one(Allergen, {
    fields: [UserAllergen.allergenId],
    references: [Allergen.id],
  }),
}));

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

export const CreateProductAllergenSchema = createInsertSchema(ProductAllergen, {
  productId: z.string().uuid(),
  allergenId: z.string().uuid(),
}).omit({
  id: true,
});

export const CreateUserAllergenSchema = createInsertSchema(UserAllergen, {
  userId: z.string().min(1),
  allergenId: z.string().uuid(),
}).omit({
  id: true,
});
