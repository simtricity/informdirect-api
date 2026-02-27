/**
 * Error classes for the Inform Direct API client.
 *
 * @module
 */

/** Base error for all Inform Direct API failures */
export class InformDirectError extends Error {
  /** Create an API error with HTTP status and optional response body. */
  constructor(
    message: string,
    /** HTTP status code (0 for client-side validation errors) */
    public readonly status: number,
    /** Parsed response body, if available */
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "InformDirectError";
  }
}

/** Authentication-specific error (bad key, expired token, refresh failure) */
export class AuthenticationError extends InformDirectError {
  /** Create an authentication error. */
  constructor(message: string, status: number, body?: unknown) {
    super(message, status, body);
    this.name = "AuthenticationError";
  }
}
