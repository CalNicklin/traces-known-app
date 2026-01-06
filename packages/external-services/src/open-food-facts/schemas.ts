import { z } from "zod/v4";

/**
 * Zod schemas for Open Food Facts API responses
 * Based on: https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/#get-/api/v2/product/-code-
 *
 * Uses a minimal schema that only validates fields we actually use in mappers.
 * Uses .passthrough() to allow additional fields without validation errors.
 */

/**
 * Ingredient object schema - only fields we use
 */
const IngredientSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().optional(),
    percent: z.number().optional(),
    percent_estimate: z.number().optional(),
    percent_max: z.number().optional(),
    percent_min: z.number().optional(),
    vegan: z.string().optional(),
    vegetarian: z.string().optional(),
  })
  .passthrough();

/**
 * Product schema - minimal validation for fields we actually use
 * Uses passthrough to allow any additional fields from the API
 */
const ProductSchema = z
  .object({
    // Product identification
    _id: z.string().optional(),
    code: z.string().optional(),

    // Names - we use these
    product_name: z.string().optional(),
    product_name_en: z.string().optional(),
    generic_name: z.string().optional(),
    generic_name_en: z.string().optional(),

    // Brand
    brands: z.string().optional(),
    brands_tags: z.array(z.string()).optional(),

    // Allergens - we use these
    allergens: z.string().optional(),
    allergens_from_ingredients: z.string().optional(),
    allergens_from_user: z.string().optional(),
    allergens_tags: z.array(z.string()).optional(),

    // Ingredients - we use these
    ingredients: z.array(IngredientSchema).optional(),
    ingredients_tags: z.array(z.string()).optional(),
    ingredients_text: z.string().optional(),
    ingredients_text_en: z.string().optional(),
    ingredients_text_with_allergens: z.string().optional(),
    ingredients_text_with_allergens_en: z.string().optional(),

    // Images - we use these
    image_url: z.string().optional(),
    image_front_url: z.string().optional(),
    image_front_small_url: z.string().optional(),
    image_small_url: z.string().optional(),

    // Categories
    categories: z.string().optional(),
    categories_tags: z.array(z.string()).optional(),

    // Quantity - can be string or number
    quantity: z.union([z.string(), z.number()]).optional(),
    product_quantity: z.union([z.string(), z.number()]).optional(),
    serving_quantity: z.union([z.string(), z.number()]).optional(),
    serving_size: z.string().optional(),

    // Nutrition grade
    nutriscore_grade: z.string().optional(),
    nutrition_grades: z.string().optional(),

    // Status
    status: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough(); // Allow any other fields from the API

/**
 * Schema for the root API response
 */
export const OpenFoodFactsRootSchema = z.object({
  code: z.string(),
  status: z.number(),
  status_verbose: z.string(),
  product: ProductSchema.optional(),
});

/**
 * Schema for search response - minimal validation
 */
export const OpenFoodFactsSearchResponseSchema = z.object({
  products: z.array(
    z
      .object({
        code: z.string(),
        product_name: z.string().optional(),
        brands: z.string().optional(),
        image_url: z.string().optional(),
        image_small_url: z.string().optional(),
        nutriscore_grade: z.string().optional(),
      })
      .passthrough(),
  ),
  page: z.number().optional(),
  page_size: z.number().optional(),
  count: z.number().optional(),
});

// Type exports
export type OpenFoodFactsProduct = z.infer<typeof OpenFoodFactsRootSchema>;
export type OpenFoodFactsSearchResponse = z.infer<
  typeof OpenFoodFactsSearchResponseSchema
>;
