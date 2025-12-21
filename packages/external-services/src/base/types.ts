/**
 * Base types for external service clients
 */

export interface ExternalServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  userAgent?: string;
}

/**
 * Legacy error interface - kept for backwards compatibility
 * New code should use error classes from ./errors
 * @deprecated Use error classes instead
 */
export interface ExternalServiceError {
  code: string;
  message: string;
  statusCode?: number;
  cause?: unknown;
}

/**
 * Legacy result type - kept for backwards compatibility
 * New code should throw error classes instead
 * @deprecated Use error classes instead
 */
export type ExternalServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ExternalServiceError };
