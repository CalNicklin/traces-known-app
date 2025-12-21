import type { z } from "zod/v4";

import type { ProductFormSchema } from "@acme/db/schema";

import type { OpenFoodFactsProduct } from "./schemas";

type ProductFormData = z.infer<typeof ProductFormSchema>;

/**
 * Converts ingredient tag to human-readable format
 * e.g., "en:milk-chocolate" -> "Milk Chocolate"
 */
function formatIngredientTag(tag: string): string {
  // Remove language prefix (e.g., "en:", "fr:")
  const withoutPrefix = tag.replace(/^[a-z]{2}:/, "");
  // Replace hyphens with spaces and capitalize words
  return withoutPrefix
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Maps Open Food Facts API response to ProductFormSchema format
 * Shared utility for both Next.js and Expo apps
 */
export function mapOpenFoodFactsToProductForm(
  offData: OpenFoodFactsProduct,
): Partial<ProductFormData> {
  const product = offData.product;
  if (!product) return {};

  // Priority order for ingredients:
  // 1. ingredients_tags - normalized, machine-readable tags (cleanest)
  // 2. structured ingredients array
  // 3. ingredients_text_en or ingredients_text (raw OCR, last resort)
  let ingredients: string[] | undefined;

  if (product.ingredients_tags && product.ingredients_tags.length > 0) {
    // Use normalized tags - cleanest source
    ingredients = product.ingredients_tags
      .map(formatIngredientTag)
      .filter((text) => text.length > 0);
  } else if (product.ingredients && product.ingredients.length > 0) {
    // Use structured ingredients array
    ingredients = product.ingredients
      .map((ing) => ing.text)
      .filter((text): text is string => !!text && text.length > 0);
  } else {
    // Fall back to text field, preferring English
    const ingredientsText =
      product.ingredients_text_en || product.ingredients_text;
    if (ingredientsText) {
      ingredients = ingredientsText
        .split(/[,;]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0);
    }
  }

  return {
    name: product.product_name_en || product.product_name || undefined,
    barcode: offData.code || undefined,
    brand: product.brands || undefined,
    allergenWarning:
      product.allergens || product.allergens_from_ingredients || undefined,
    ingredients:
      ingredients && ingredients.length > 0 ? ingredients : undefined,
    imageUrl: product.image_url || product.image_front_url || undefined,
  };
}
