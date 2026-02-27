/**
 * Inform Direct API client with automatic authentication and token refresh.
 *
 * @module
 */

import type {
  AddCompanyRequest,
  AuthTokens,
  CompaniesResponse,
  CompanySummary,
  DeleteCompanyRequest,
  InformDirectConfig,
  MessageResponse,
} from "./types.ts";
import { BASE_URLS } from "./types.ts";
import { AuthenticationError, InformDirectError } from "./errors.ts";

/**
 * Client for the Inform Direct Integration API.
 *
 * Handles authentication automatically — the first API call triggers auth,
 * and 401 responses trigger token refresh (or full re-auth as a fallback).
 *
 * @example
 * ```ts
 * const client = new InformDirectClient({ apiKey: "your-key" });
 * const companies = await client.getCompanies();
 * ```
 */
export class InformDirectClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private tokens: AuthTokens | null = null;

  constructor(config: InformDirectConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? BASE_URLS.sandbox).replace(/\/+$/, "");
  }

  // --- Authentication ---

  /** Authenticate with the API key and store tokens. */
  async authenticate(): Promise<AuthTokens> {
    const res = await fetch(`${this.baseUrl}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ApiKey: this.apiKey }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AuthenticationError(
        `Authentication failed: ${res.status}`,
        res.status,
        body,
      );
    }

    this.tokens = (await res.json()) as AuthTokens;
    return this.tokens;
  }

  /** Refresh the access token using the stored refresh token. */
  private async refresh(): Promise<AuthTokens> {
    if (!this.tokens?.RefreshToken) {
      throw new AuthenticationError("No refresh token available", 0);
    }

    const res = await fetch(`${this.baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: this.tokens.RefreshToken }),
    });

    if (!res.ok) {
      this.tokens = null;
      throw new AuthenticationError(
        `Token refresh failed: ${res.status}`,
        res.status,
      );
    }

    this.tokens = (await res.json()) as AuthTokens;
    return this.tokens;
  }

  /** Invalidate the current tokens. */
  async logout(): Promise<void> {
    if (!this.tokens?.RefreshToken) return;

    await fetch(`${this.baseUrl}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: this.tokens.RefreshToken }),
    });

    this.tokens = null;
  }

  // --- Internal request handling ---

  /**
   * Make an authenticated request with automatic token management.
   *
   * 1. If no tokens, authenticate first
   * 2. Make the request with Bearer token
   * 3. On 401: try refresh(), fallback: re-authenticate(), retry once
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.tokens) {
      await this.authenticate();
    }

    const attempt = async (): Promise<Response> => {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${this.tokens!.AccessToken}`);
      if (options.body) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(`${this.baseUrl}${path}`, { ...options, headers });
    };

    let res = await attempt();

    if (res.status === 401) {
      try {
        await this.refresh();
      } catch {
        // fallback: refresh failed, try full re-authentication
        await this.authenticate();
      }
      res = await attempt();
    }

    if (!res.ok) {
      const body = await res.text();
      let message = `API error ${res.status}: ${path}`;
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
        if (parsed && typeof parsed === "object" && "Message" in parsed) {
          message = `${(parsed as { Message: string }).Message} (${res.status} ${path})`;
        }
      } catch { /* body is not JSON */ }
      throw new InformDirectError(message, res.status, parsed);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  // --- Company endpoints ---

  /** List all companies in the portfolio. */
  async getCompanies(): Promise<CompanySummary[]> {
    const data = await this.request<CompaniesResponse>("/companies");
    return data.Companies ?? [];
  }

  /** Get a single company by Companies House number. */
  async getCompany(companyNumber: string): Promise<CompanySummary | null> {
    const data = await this.request<CompaniesResponse>(
      `/companies/${encodeURIComponent(companyNumber)}`,
    );
    return data.Companies?.[0] ?? null;
  }

  /** Add a company to the portfolio. */
  async addCompany(
    companyNumber: string,
    authenticationCode?: string,
  ): Promise<MessageResponse> {
    const body: AddCompanyRequest = { CompanyNumber: companyNumber };
    if (authenticationCode) {
      body.AuthenticationCode = authenticationCode;
    }
    return this.request<MessageResponse>("/companies/add", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** Remove a company from the portfolio. */
  async removeCompany(
    companyNumber: string,
    options?: { saveRegisters?: boolean; saveDocuments?: boolean },
  ): Promise<MessageResponse> {
    const body: DeleteCompanyRequest = {
      CompanyNumber: companyNumber,
      SaveRegisters: options?.saveRegisters,
      SaveDocuments: options?.saveDocuments,
    };
    return this.request<MessageResponse>("/companies/delete", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}
