/**
 * Error classes for the Inform Direct API client.
 *
 * @module
 */

/** Base error for all Inform Direct API failures */
export class InformDirectError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "InformDirectError";
  }
}

/** Authentication-specific error (bad key, expired token, refresh failure) */
export class AuthenticationError extends InformDirectError {
  constructor(message: string, status: number, body?: unknown) {
    super(message, status, body);
    this.name = "AuthenticationError";
  }
}
