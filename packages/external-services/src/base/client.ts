import type { z } from "zod/v4";
import { createFetch } from "@better-fetch/fetch";

import type { ExternalServiceConfig } from "./types";
import {
  APICallError,
  InvalidResponseDataError,
  NetworkError,
  TimeoutError,
  TooManyRequestsError,
} from "./errors";

/**
 * Default configuration for external service clients
 */
const DEFAULT_CONFIG: Required<Omit<ExternalServiceConfig, "baseUrl">> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  userAgent: "TracesKnown/1.0",
};

/**
 * Creates a configured BetterFetch instance for external service clients
 */
export function createExternalServiceClient(config: ExternalServiceConfig) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    retries: config.retries ?? DEFAULT_CONFIG.retries,
    retryDelay: config.retryDelay ?? DEFAULT_CONFIG.retryDelay,
    userAgent: config.userAgent ?? DEFAULT_CONFIG.userAgent,
  };

  const $fetch = createFetch({
    baseURL: config.baseUrl,
    timeout: finalConfig.timeout,
    retry: {
      type: "exponential",
      attempts: finalConfig.retries,
      baseDelay: finalConfig.retryDelay,
      maxDelay: finalConfig.retryDelay * 10, // Cap at 10x base delay
    },
    headers: {
      "User-Agent": finalConfig.userAgent,
    },
    throw: true, // Throw errors instead of returning { data, error }
  });

  return {
    /**
     * Fetch with schema validation
     * Throws error classes on failure
     */
    async fetch<T>(
      path: string,
      options?: {
        schema?: z.ZodSchema<T>;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      },
    ): Promise<T> {
      try {
        // Explicitly pass throw: true to help TypeScript narrow the return type
        // BetterFetchResponse<T, E, Throw> returns T when Throw is true
        const response = await $fetch<T>(path, {
          method: options?.method ?? "GET",
          headers: options?.headers,
          body: options?.body,
          output: options?.schema,
          throw: true, // Explicitly set to ensure TypeScript narrows to T
        });

        // With throw: true, BetterFetchResponse returns T directly
        return response;
      } catch (error) {
        // Convert BetterFetch errors to our error classes
        throw convertBetterFetchError(error);
      }
    },
  };
}

/**
 * Converts BetterFetch errors to our error classes
 */
function convertBetterFetchError(error: unknown): never {
  // If it's already one of our error classes, re-throw
  if (
    error instanceof APICallError ||
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    error instanceof InvalidResponseDataError ||
    error instanceof TooManyRequestsError
  ) {
    throw error;
  }

  // Handle Response objects (BetterFetch may throw Response on HTTP errors)
  if (error instanceof Response) {
    const status = error.status;
    const statusText = error.statusText;

    if (status === 429) {
      const retryAfter = extractRetryAfter(error);
      throw new TooManyRequestsError({
        cause: error,
        retryAfter,
      });
    }

    throw new APICallError({
      statusCode: status,
      statusText,
      cause: error,
      isRetryable: status >= 500 && status < 600,
    });
  }

  // Handle Response-like errors (objects with status property)
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status as number;
    const statusText =
      ("statusText" in error && typeof error.statusText === "string"
        ? error.statusText
        : undefined) ?? "Unknown";

    if (status === 429) {
      const retryAfter = extractRetryAfter(error);
      throw new TooManyRequestsError({
        cause: error,
        retryAfter,
      });
    }

    throw new APICallError({
      statusCode: status,
      statusText,
      cause: error,
      isRetryable: status >= 500 && status < 600,
    });
  }

  // Handle validation errors (Zod errors from BetterFetch schema validation)
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    throw new InvalidResponseDataError({
      validationErrors: error,
      cause: error,
    });
  }

  // Handle timeout errors
  if (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message.includes("timeout") ||
      error.message.includes("Timeout"))
  ) {
    throw new TimeoutError({
      timeout: 10000, // Default timeout
      cause: error,
    });
  }

  // Handle network errors
  if (error instanceof Error) {
    throw new NetworkError({
      message: error.message,
      cause: error,
    });
  }

  // Fallback to network error
  throw new NetworkError({
    message: "Unknown error occurred",
    cause: error,
  });
}

/**
 * Extracts retry-after value from response headers
 */
function extractRetryAfter(error: unknown): number | undefined {
  if (error instanceof Response) {
    const retryAfter = error.headers.get("retry-after");
    if (retryAfter) {
      const parsed = Number.parseInt(retryAfter, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  if (
    error &&
    typeof error === "object" &&
    "headers" in error &&
    error.headers
  ) {
    const headers = error.headers as Headers | Record<string, string>;
    const retryAfter =
      headers instanceof Headers
        ? headers.get("retry-after")
        : (headers["retry-after"] ?? headers["Retry-After"]);

    if (retryAfter) {
      const parsed = Number.parseInt(retryAfter, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}
