import { relations } from "drizzle-orm";

import { Allergen, ProductAllergen, UserAllergen } from "./allergen-schema";
import { user } from "./auth-schema";
import { Product } from "./product-schema";
import { Report, ReportAllergen } from "./report-schema";

// =============================================================================
// All relations consolidated here to avoid duplicate definitions
// Drizzle requires exactly ONE relations() call per table
// =============================================================================

// Product relations
export const ProductRelations = relations(Product, ({ many }) => ({
  productAllergens: many(ProductAllergen),
  reports: many(Report),
}));

// ProductAllergen relations (junction table)
export const ProductAllergenRelations = relations(
  ProductAllergen,
  ({ one }) => ({
    product: one(Product, {
      fields: [ProductAllergen.productId],
      references: [Product.id],
    }),
    allergen: one(Allergen, {
      fields: [ProductAllergen.allergenId],
      references: [Allergen.id],
    }),
  }),
);

// Report relations
export const ReportRelations = relations(Report, ({ one, many }) => ({
  product: one(Product, {
    fields: [Report.productId],
    references: [Product.id],
  }),
  user: one(user, {
    fields: [Report.userId],
    references: [user.id],
  }),
  reportAllergens: many(ReportAllergen),
}));

// ReportAllergen relations (junction table)
export const ReportAllergenRelations = relations(ReportAllergen, ({ one }) => ({
  report: one(Report, {
    fields: [ReportAllergen.reportId],
    references: [Report.id],
  }),
  allergen: one(Allergen, {
    fields: [ReportAllergen.allergenId],
    references: [Allergen.id],
  }),
}));

// Allergen relations
export const AllergenRelations = relations(Allergen, ({ many }) => ({
  productAllergens: many(ProductAllergen),
  userAllergens: many(UserAllergen),
  reportAllergens: many(ReportAllergen),
}));

// UserAllergen relations (junction table)
export const UserAllergenRelations = relations(UserAllergen, ({ one }) => ({
  user: one(user, {
    fields: [UserAllergen.userId],
    references: [user.id],
  }),
  allergen: one(Allergen, {
    fields: [UserAllergen.allergenId],
    references: [Allergen.id],
  }),
}));

// User relations
export const UserRelations = relations(user, ({ many }) => ({
  userAllergens: many(UserAllergen),
  reports: many(Report),
}));
