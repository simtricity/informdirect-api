/**
 * Safe read-only tests — can be run against sandbox or production.
 *
 * These tests only authenticate and read data. They never add or remove companies.
 *
 * Uses INFORM_DIRECT_API_KEY (production) by default.
 * Set INFORM_DIRECT_SAFE_TEST_SANDBOX=1 to use sandbox key instead.
 *
 * Run: deno task test
 */

import "@std/dotenv/load";
import { assertEquals, assertExists } from "@std/assert";
import {
  BASE_URLS,
  InformDirectClient,
  type AuthTokens,
  type CompanySummary,
} from "../lib/mod.ts";

// --- Setup ---

const useSandbox = Deno.env.get("INFORM_DIRECT_SAFE_TEST_SANDBOX") === "1";
const envKeyName = useSandbox
  ? "INFORM_DIRECT_SANDBOX_API_KEY"
  : "INFORM_DIRECT_API_KEY";
const apiKey = Deno.env.get(envKeyName);

if (!apiKey) {
  throw new Error(`${envKeyName} is required to run tests`);
}

const baseUrl = useSandbox ? BASE_URLS.sandbox : BASE_URLS.production;

function makeClient(): InformDirectClient {
  return new InformDirectClient({ apiKey: apiKey!, baseUrl });
}

// --- Tests ---

Deno.test("authenticate returns valid tokens", async () => {
  const client = makeClient();
  const tokens: AuthTokens = await client.authenticate();

  assertExists(tokens.AccessToken, "AccessToken should be present");
  assertExists(tokens.RefreshToken, "RefreshToken should be present");
  assertEquals(typeof tokens.AccessToken, "string");
  assertEquals(typeof tokens.RefreshToken, "string");

  // JWT format check: three dot-separated segments
  const parts = tokens.AccessToken.split(".");
  assertEquals(parts.length, 3, "AccessToken should be a JWT with 3 parts");

  await client.logout();
});

Deno.test("getCompanies returns a non-empty array", async () => {
  const client = makeClient();
  const companies: CompanySummary[] = await client.getCompanies();

  assertEquals(Array.isArray(companies), true, "should return an array");
  assertEquals(companies.length > 0, true, "should have at least one company");

  // Check shape of first company
  const first = companies[0];
  assertExists(first.CompanyNumber, "CompanyNumber should be present");
  assertExists(first.Name, "Name should be present");
  assertEquals(typeof first.CompanyNumber, "string");
  assertEquals(typeof first.Name, "string");

  await client.logout();
});

Deno.test("getCompany returns details for a known company", async () => {
  const client = makeClient();

  // Get the first company from the list, then fetch it individually
  const companies = await client.getCompanies();
  assertEquals(companies.length > 0, true, "need at least one company");

  const target = companies[0].CompanyNumber;
  const detail = await client.getCompany(target);

  assertExists(detail, `getCompany(${target}) should return a result`);
  assertEquals(detail!.CompanyNumber, target, "CompanyNumber should match");
  assertExists(detail!.Name, "Name should be present");

  await client.logout();
});

Deno.test("lazy auth works — getCompanies without explicit authenticate", async () => {
  // Create a fresh client and call getCompanies directly without authenticate()
  const client = makeClient();
  const companies = await client.getCompanies();

  assertEquals(Array.isArray(companies), true, "should return an array");
  assertEquals(companies.length > 0, true, "should have at least one company");

  await client.logout();
});
