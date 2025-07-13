import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { appSchema } from "./base";

export const Product = appSchema.table("product", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 255 }).notNull(),
  barcode: t.varchar({ length: 50 }).unique(),
  allergenWarning: t.text(),
  riskLevel: t.varchar({ length: 50 }),
  ingredients: t.text().array(),
  imageUrl: t.varchar({ length: 500 }),
  brand: t.varchar({ length: 255 }),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().defaultNow().notNull(),
}));

// Schemas
export const CreateProductSchema = createInsertSchema(Product, {
  name: z.string().max(255),
  barcode: z.string().max(50).optional(),
  allergenWarning: z.string().optional(),
  riskLevel: z.string().max(50).optional(),
  ingredients: z.array(z.string()).optional(),
  imageUrl: z.string().max(500).optional(),
  brand: z.string().max(255).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const SelectProductSchema = createSelectSchema(Product);

// Search result type
export interface SearchResultProduct {
  id: string;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
  inDb: boolean;
}
