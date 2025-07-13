import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema } from "./base";

export const Allergen = appSchema.table("allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 255 }).notNull().unique(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const ProductAllergen = appSchema.table("product_allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  productId: t.uuid().notNull(),
  allergenId: t
    .uuid()
    .notNull()
    .references(() => Allergen.id),
}));

export const UserAllergen = appSchema.table("user_allergen", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t.varchar({ length: 255 }).notNull(),
  allergenId: t
    .uuid()
    .notNull()
    .references(() => Allergen.id),
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
