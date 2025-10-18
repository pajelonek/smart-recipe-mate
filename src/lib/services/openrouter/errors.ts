/**
 * Custom error types for OpenRouter service
 */

/**
 * Base error class for OpenRouter-related errors
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Error thrown when OpenRouter service configuration is invalid
 */
export class ConfigurationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown when OpenRouter API request fails
 */
export class ApiError extends OpenRouterError {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when input or output validation fails
 */
export class ValidationError extends OpenRouterError {
  public details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
