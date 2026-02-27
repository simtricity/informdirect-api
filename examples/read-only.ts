#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Read-only example — safe to run against sandbox or production.
 *
 * Demonstrates authenticating with the Inform Direct API and reading
 * company data using the @simtricity/informdirect-api client library.
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read examples/read-only.ts
 *   deno run --allow-net --allow-env --allow-read examples/read-only.ts --sandbox
 */

import "@std/dotenv/load";
import { BASE_URLS, InformDirectClient } from "../lib/mod.ts";

// --- Configuration ---

const sandbox = Deno.args.includes("--sandbox");
const envKeyName = sandbox
  ? "INFORM_DIRECT_SANDBOX_API_KEY"
  : "INFORM_DIRECT_API_KEY";
const apiKey = Deno.env.get(envKeyName);

if (!apiKey) {
  console.error(`Set ${envKeyName} in your .env file or environment.`);
  Deno.exit(1);
}

const baseUrl = sandbox ? BASE_URLS.sandbox : BASE_URLS.production;
console.log(`Environment: ${sandbox ? "SANDBOX" : "PRODUCTION"}`);
console.log(`Base URL:    ${baseUrl}`);
console.log(`API Key:     ...${apiKey.slice(-6)}\n`);

// --- Create client ---

const client = new InformDirectClient({ apiKey, baseUrl });

// --- Authenticate ---

console.log("1. Authenticating...");
const tokens = await client.authenticate();
console.log(`   Access token:  ...${tokens.AccessToken.slice(-6)}`);
console.log(`   Refresh token: ...${tokens.RefreshToken.slice(-6)}\n`);

// --- List all companies ---

console.log("2. Listing companies...");
const companies = await client.getCompanies();
console.log(`   Found ${companies.length} company(ies):\n`);

for (const company of companies) {
  console.log(`   ${company.CompanyNumber}  ${company.Name}`);
}

// --- Get first company details ---

if (companies.length > 0) {
  const firstNumber = companies[0].CompanyNumber;
  console.log(`\n3. Getting details for ${firstNumber}...`);
  const detail = await client.getCompany(firstNumber);
  if (detail) {
    console.log(`   Name:   ${detail.Name}`);
    console.log(`   Number: ${detail.CompanyNumber}`);
    console.log(`   URL:    ${detail.PublicUrl}`);
  }
}

// --- Clean up ---

console.log("\n4. Logging out...");
await client.logout();
console.log("   Done.");
