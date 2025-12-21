import type { ExternalServiceConfig } from "../base/types";
import type {
  OpenFoodFactsProduct,
  OpenFoodFactsSearchResponse,
} from "./schemas";
import { createExternalServiceClient } from "../base/client";
import { APICallError } from "../base/errors";
import {
  OpenFoodFactsRootSchema,
  OpenFoodFactsSearchResponseSchema,
} from "./schemas";

/**
 * Default configuration for Open Food Facts API
 */
const DEFAULT_CONFIG: ExternalServiceConfig = {
  baseUrl: "https://world.openfoodfacts.org",
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  userAgent: "TracesKnown/1.0 (https://traces-known.com)",
};

/**
 * Creates an Open Food Facts API client
 */
export function createOpenFoodFactsClient(
  config?: Partial<ExternalServiceConfig>,
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const client = createExternalServiceClient(finalConfig);

  return {
    /**
     * Get product by code (barcode)
     * @see https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/#get-/api/v2/product/-code-
     */
    async getProductByCode(
      code: string,
      options?: { fields?: string; lc?: string },
    ): Promise<OpenFoodFactsProduct> {
      const params = new URLSearchParams();
      // Default to English for cleaner, language-specific data
      params.set("lc", options?.lc ?? "en");
      if (options?.fields) {
        params.set("fields", options.fields);
      }

      const data = await client.fetch<OpenFoodFactsProduct>(
        `/api/v2/product/${code}?${params.toString()}`,
        {
          schema: OpenFoodFactsRootSchema,
        },
      );

      // Check if product was found
      if (data.status === 0 || !data.product) {
        throw new APICallError({
          statusCode: 404,
          statusText: "Product not found",
          isRetryable: false,
        });
      }

      return data;
    },

    /**
     * Search for products
     * @see https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api
     */
    async searchProducts(
      query: string,
      options?: {
        page?: number;
        pageSize?: number;
        categories?: string;
        nutritionGrade?: string;
      },
    ): Promise<OpenFoodFactsSearchResponse> {
      const params = new URLSearchParams();
      params.set("search_terms", query);
      if (options?.page) params.set("page", options.page.toString());
      if (options?.pageSize)
        params.set("page_size", options.pageSize.toString());
      if (options?.categories) params.set("categories", options.categories);
      if (options?.nutritionGrade)
        params.set("nutrition_grade", options.nutritionGrade);

      return client.fetch<OpenFoodFactsSearchResponse>(
        `/api/v2/search?${params.toString()}`,
        {
          schema: OpenFoodFactsSearchResponseSchema,
        },
      );
    },
  };
}
