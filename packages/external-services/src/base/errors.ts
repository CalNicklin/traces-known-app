/**
 * Error classes for external service clients
 * Pattern based on Vercel AI SDK error handling
 */

/**
 * Base error class for all external service errors
 */
export abstract class BaseError extends Error {
  readonly code: string;
  readonly cause?: unknown;
  readonly isRetryable?: boolean;

  constructor(
    code: string,
    message: string,
    options?: {
      cause?: unknown;
      isRetryable?: boolean;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = options?.cause;
    this.isRetryable = options?.isRetryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Check if an error is an instance of this error class
   */
  static isInstance(error: unknown): error is BaseError {
    return error instanceof this;
  }
}

/**
 * Error for HTTP API call failures
 */
export class APICallError extends BaseError {
  readonly statusCode: number;
  readonly statusText: string;

  constructor(options: {
    statusCode: number;
    statusText: string;
    cause?: unknown;
    isRetryable?: boolean;
  }) {
    super(
      "API_CALL_ERROR",
      `HTTP ${options.statusCode}: ${options.statusText}`,
      {
        cause: options.cause,
        isRetryable:
          options.isRetryable ??
          (options.statusCode >= 500 && options.statusCode < 600),
      },
    );
    this.statusCode = options.statusCode;
    this.statusText = options.statusText;
  }

  static isInstance(error: unknown): error is APICallError {
    return error instanceof APICallError;
  }
}

/**
 * Error for rate limiting (429 Too Many Requests)
 */
export class TooManyRequestsError extends APICallError {
  readonly retryAfter?: number;

  constructor(options: { cause?: unknown; retryAfter?: number }) {
    super({
      statusCode: 429,
      statusText: "Too Many Requests",
      cause: options.cause,
      isRetryable: true,
    });
    this.retryAfter = options.retryAfter;
  }

  static isInstance(error: unknown): error is TooManyRequestsError {
    return error instanceof TooManyRequestsError;
  }
}

/**
 * Error for invalid response data (validation/schema errors)
 */
export class InvalidResponseDataError extends BaseError {
  readonly validationErrors: unknown;

  constructor(options: {
    message?: string;
    validationErrors: unknown;
    cause?: unknown;
  }) {
    super(
      "INVALID_RESPONSE_DATA",
      options.message ?? "Invalid response data structure",
      {
        cause: options.cause,
        isRetryable: false,
      },
    );
    this.validationErrors = options.validationErrors;
  }

  static isInstance(error: unknown): error is InvalidResponseDataError {
    return error instanceof InvalidResponseDataError;
  }
}

/**
 * Error for network failures
 */
export class NetworkError extends BaseError {
  constructor(options: { message?: string; cause?: unknown }) {
    super("NETWORK_ERROR", options.message ?? "Network request failed", {
      cause: options.cause,
      isRetryable: true,
    });
  }

  static isInstance(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
  }
}

/**
 * Error for request timeouts
 */
export class TimeoutError extends NetworkError {
  readonly timeout: number;

  constructor(options: { timeout: number; cause?: unknown }) {
    super({
      message: `Request timeout after ${options.timeout}ms`,
      cause: options.cause,
    });
    this.timeout = options.timeout;
  }

  static isInstance(error: unknown): error is TimeoutError {
    return error instanceof TimeoutError;
  }
}
