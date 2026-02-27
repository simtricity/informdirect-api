/**
 * Type definitions for the Inform Direct Integration API.
 *
 * All request/response types use PascalCase field names to match the API wire format.
 * Internal configuration types use camelCase.
 *
 * @module
 */

// === Authentication ===

/** Request body for POST /authenticate */
export interface AuthenticateRequest {
  /** The API key issued by Inform Direct */
  ApiKey: string;
}

/** Response from POST /authenticate and POST /refresh */
export interface AuthTokens {
  /** JWT access token (valid 15 minutes) */
  AccessToken: string;
  /** Refresh token for obtaining new access tokens */
  RefreshToken: string;
}

/** Request body for POST /refresh and POST /logout */
export interface RefreshRequest {
  /** The refresh token from a previous authentication */
  RefreshToken: string;
}

// === Companies ===

/** A company summary as returned by the API */
export interface CompanySummary {
  /** UK Companies House number (8 digits or 2-letter prefix + 6 digits) */
  CompanyNumber: string;
  /** Registered company name */
  Name: string;
  /** Public URL on Inform Direct */
  PublicUrl: string;
}

/** Response from GET /companies and GET /companies/{num} */
export interface CompaniesResponse {
  /** Array of company summaries */
  Companies: CompanySummary[];
}

/** Request body for POST /companies/add */
export interface AddCompanyRequest {
  /** UK Companies House number */
  CompanyNumber: string;
  /** Companies House authentication code (required for some companies) */
  AuthenticationCode?: string;
}

/** Request body for PUT /companies/delete */
export interface DeleteCompanyRequest {
  /** UK Companies House number */
  CompanyNumber: string;
  /** Whether to save statutory registers on removal */
  SaveRegisters?: boolean;
  /** Whether to save documents on removal */
  SaveDocuments?: boolean;
}

/** Generic message response from mutating endpoints */
export interface MessageResponse {
  /** Human-readable result message */
  Message: string;
}

// === Client Configuration ===

/** Configuration for creating an InformDirectClient */
export interface InformDirectConfig {
  /** Inform Direct API key */
  apiKey: string;
  /** Base URL — defaults to sandbox */
  baseUrl?: string;
}

/** Known environment base URLs */
export type Environment = "sandbox" | "production";

/** Base URL mapping for known environments */
export const BASE_URLS: Record<Environment, string> = {
  sandbox: "https://sandbox-api.informdirect.co.uk",
  production: "https://api.informdirect.co.uk",
} as const;
