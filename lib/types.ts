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
  ApiKey: string;
}

/** Response from POST /authenticate and POST /refresh */
export interface AuthTokens {
  AccessToken: string;
  RefreshToken: string;
}

/** Request body for POST /refresh and POST /logout */
export interface RefreshRequest {
  RefreshToken: string;
}

// === Companies ===

/** A company summary as returned by the API */
export interface CompanySummary {
  CompanyNumber: string;
  Name: string;
  PublicUrl: string;
}

/** Response from GET /companies and GET /companies/{num} */
export interface CompaniesResponse {
  Companies: CompanySummary[];
}

/** Request body for POST /companies/add */
export interface AddCompanyRequest {
  CompanyNumber: string;
  AuthenticationCode?: string;
}

/** Request body for PUT /companies/delete */
export interface DeleteCompanyRequest {
  CompanyNumber: string;
  SaveRegisters?: boolean;
  SaveDocuments?: boolean;
}

/** Generic message response from mutating endpoints */
export interface MessageResponse {
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
