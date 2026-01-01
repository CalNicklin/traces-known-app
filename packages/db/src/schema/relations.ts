import { relations } from "drizzle-orm";

import { Allergen, ProductAllergen, UserAllergen } from "./allergen-schema";
import { user } from "./auth-schema";
import { Category, ProductCategory } from "./category-schema";
import { Product } from "./product-schema";
import { ProductView } from "./product-view-schema";
import { ImageReport, ReportImage } from "./report-image-schema";
import { Report, ReportAllergen } from "./report-schema";

// =============================================================================
// All relations consolidated here to avoid duplicate definitions
// Drizzle requires exactly ONE relations() call per table
// =============================================================================

// Product relations
export const ProductRelations = relations(Product, ({ many }) => ({
  productAllergens: many(ProductAllergen),
  productCategories: many(ProductCategory),
  productViews: many(ProductView),
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

// ProductCategory relations (junction table)
export const ProductCategoryRelations = relations(
  ProductCategory,
  ({ one }) => ({
    product: one(Product, {
      fields: [ProductCategory.productId],
      references: [Product.id],
    }),
    category: one(Category, {
      fields: [ProductCategory.categoryId],
      references: [Category.id],
    }),
  }),
);

// Category relations
export const CategoryRelations = relations(Category, ({ many }) => ({
  productCategories: many(ProductCategory),
}));

// ProductView relations
export const ProductViewRelations = relations(ProductView, ({ one }) => ({
  product: one(Product, {
    fields: [ProductView.productId],
    references: [Product.id],
  }),
  user: one(user, {
    fields: [ProductView.userId],
    references: [user.id],
  }),
}));

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
  images: many(ReportImage),
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

// ReportImage relations
export const ReportImageRelations = relations(ReportImage, ({ one, many }) => ({
  report: one(Report, {
    fields: [ReportImage.reportId],
    references: [Report.id],
  }),
  uploader: one(user, {
    fields: [ReportImage.uploadedBy],
    references: [user.id],
    relationName: "uploadedImages",
  }),
  imageReports: many(ImageReport),
}));

// ImageReport relations (user reports of inappropriate images)
export const ImageReportRelations = relations(ImageReport, ({ one }) => ({
  image: one(ReportImage, {
    fields: [ImageReport.imageId],
    references: [ReportImage.id],
  }),
  reporter: one(user, {
    fields: [ImageReport.reportedBy],
    references: [user.id],
    relationName: "reportedImages",
  }),
  resolver: one(user, {
    fields: [ImageReport.resolvedBy],
    references: [user.id],
    relationName: "resolvedImageReports",
  }),
}));

// User relations
export const UserRelations = relations(user, ({ many }) => ({
  userAllergens: many(UserAllergen),
  reports: many(Report),
  productViews: many(ProductView),
  uploadedImages: many(ReportImage, { relationName: "uploadedImages" }),
  reportedImages: many(ImageReport, { relationName: "reportedImages" }),
  resolvedImageReports: many(ImageReport, { relationName: "resolvedImageReports" }),
}));
