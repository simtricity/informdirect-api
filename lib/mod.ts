/**
 * Inform Direct Integration API client library.
 *
 * @example
 * ```ts
 * import { InformDirectClient } from "@simtricity/informdirect-api";
 *
 * const client = new InformDirectClient({ apiKey: "your-key" });
 * const companies = await client.getCompanies();
 * ```
 *
 * @module
 */

export { InformDirectClient } from "./client.ts";
export type {
  AddCompanyRequest,
  AuthenticateRequest,
  AuthTokens,
  CompaniesResponse,
  CompanySummary,
  DeleteCompanyRequest,
  Environment,
  InformDirectConfig,
  MessageResponse,
  RefreshRequest,
} from "./types.ts";
export { BASE_URLS } from "./types.ts";
export { AuthenticationError, InformDirectError } from "./errors.ts";
