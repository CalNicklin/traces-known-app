import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import {
  APICallError,
  createOpenFoodFactsClient,
  InvalidResponseDataError,
  NetworkError,
  TimeoutError,
  TooManyRequestsError,
} from "@acme/external-services";

import { protectedProcedure } from "../../trpc";

export const openFoodFactsRouter = {
  /**
   * Get product by code (barcode) from Open Food Facts
   */
  byCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        fields: z.string().optional(), // Comma-separated string, not array
      }),
    )
    .query(async ({ input }) => {
      const client = createOpenFoodFactsClient();

      try {
        const data = await client.getProductByCode(input.code, {
          fields: input.fields,
        });

        return data;
      } catch (error) {
        // Map error classes to TRPCError
        if (APICallError.isInstance(error)) {
          if (error.statusCode === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Product with code ${input.code} not found`,
              cause: error,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }

        if (TooManyRequestsError.isInstance(error)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: error.message,
            cause: error,
          });
        }

        if (InvalidResponseDataError.isInstance(error)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }

        if (NetworkError.isInstance(error) || TimeoutError.isInstance(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }

        // Fallback for unknown errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          cause: error,
        });
      }
    }),

  /**
   * Search for products in Open Food Facts
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(24),
        categories: z.string().optional(),
        nutritionGrade: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const client = createOpenFoodFactsClient();

      try {
        return await client.searchProducts(input.query, {
          page: input.page,
          pageSize: input.pageSize,
          categories: input.categories,
          nutritionGrade: input.nutritionGrade,
        });
      } catch (error) {
        // Map error classes to TRPCError
        if (APICallError.isInstance(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }

        if (TooManyRequestsError.isInstance(error)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: error.message,
            cause: error,
          });
        }

        if (InvalidResponseDataError.isInstance(error)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }

        if (NetworkError.isInstance(error) || TimeoutError.isInstance(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }

        // Fallback for unknown errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          cause: error,
        });
      }
    }),
} satisfies TRPCRouterRecord;
