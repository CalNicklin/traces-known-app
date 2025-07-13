import { relations } from "drizzle-orm";

import { Allergen, ProductAllergen } from "./allergen-schema";
import { Product } from "./product-schema";
import { Report, ReportAllergen } from "./report-schema";

// Cross-module relations
export const ProductRelations = relations(Product, ({ many }) => ({
  productAllergens: many(ProductAllergen),
  reports: many(Report),
}));

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

export const ReportProductRelations = relations(Report, ({ one }) => ({
  product: one(Product, {
    fields: [Report.productId],
    references: [Product.id],
  }),
}));

export const ReportAllergenAllergenRelations = relations(
  ReportAllergen,
  ({ one }) => ({
    allergen: one(Allergen, {
      fields: [ReportAllergen.allergenId],
      references: [Allergen.id],
    }),
  }),
);

// Update AllergenRelations to include report allergens
export const AllergenReportRelations = relations(Allergen, ({ many }) => ({
  reportAllergens: many(ReportAllergen),
}));
