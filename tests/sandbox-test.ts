#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Inform Direct Sandbox Compliance Test
 *
 * Runs the 4 required sandbox operations to qualify for a production key:
 *   1. Add company
 *   2. Get companies (list)
 *   3. Get company (single)
 *   4. Remove company
 *
 * Env vars:
 *   INFORM_DIRECT_API_KEY  — sandbox API key (required)
 *   TEST_COMPANY_NUMBER    — company to add/remove (default: 00006400)
 *
 * Run: deno task test:sandbox
 */

import "@std/dotenv/load";
import { InformDirectClient, InformDirectError } from "../lib/mod.ts";

const API_KEY = Deno.env.get("INFORM_DIRECT_API_KEY");
if (!API_KEY) {
  console.error("INFORM_DIRECT_API_KEY is required");
  Deno.exit(1);
}

const TEST_COMPANY = Deno.env.get("TEST_COMPANY_NUMBER") ?? "00014259";

const client = new InformDirectClient({ apiKey: API_KEY });

let passed = 0;
let failed = 0;

function pass(step: string, detail?: string): void {
  passed++;
  console.log(`  PASS  ${step}${detail ? ` — ${detail}` : ""}`);
}

function fail(step: string, error: unknown): void {
  failed++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  FAIL  ${step} — ${msg}`);
}

console.log("Inform Direct Sandbox Compliance Test");
console.log(`API Key  : ...${API_KEY.slice(-6)}`);
console.log(`Test co. : ${TEST_COMPANY}\n`);

// --- Step 1: Add company ---
console.log("Step 1: Add company");
try {
  const result = await client.addCompany(TEST_COMPANY);
  pass("POST /companies/add", result.Message);
} catch (e) {
  if (e instanceof InformDirectError && e.status === 429) {
    fail(
      "POST /companies/add",
      "rate limited (429) — wait a few minutes and re-run",
    );
  } else if (e instanceof InformDirectError && e.status === 422) {
    // Company may already exist — check if it's in the list
    const companies = await client.getCompanies();
    if (companies.some((c) => c.CompanyNumber === TEST_COMPANY)) {
      pass(
        "POST /companies/add",
        `already exists (${
          (e.body as { Message: string })?.Message
        }) — treating as pass`,
      );
    } else {
      fail("POST /companies/add", e);
    }
  } else {
    fail("POST /companies/add", e);
  }
}

// --- Step 2: List companies ---
console.log("Step 2: List companies");
try {
  const companies = await client.getCompanies();
  const found = companies.some((c) => c.CompanyNumber === TEST_COMPANY);
  if (!found) {
    fail(
      "GET /companies",
      `Test company ${TEST_COMPANY} not in list of ${companies.length}`,
    );
  } else {
    pass("GET /companies", `${companies.length} company(ies)`);
  }
} catch (e) {
  fail("GET /companies", e);
}

// --- Step 3: Get single company ---
console.log("Step 3: Get company");
try {
  const company = await client.getCompany(TEST_COMPANY);
  if (!company) {
    fail("GET /companies/{num}", "Company not found");
  } else {
    pass("GET /companies/{num}", company.Name);
  }
} catch (e) {
  fail("GET /companies/{num}", e);
}

// --- Step 4: Remove company ---
console.log("Step 4: Remove company");
try {
  const result = await client.removeCompany(TEST_COMPANY);
  pass("PUT /companies/delete", result.Message);
} catch (e) {
  if (
    e instanceof InformDirectError && e.status === 422 &&
    (e.body as { Message?: string })?.Message?.includes("last on the account")
  ) {
    pass(
      "PUT /companies/delete",
      "cannot delete last company — API responded correctly",
    );
  } else {
    fail("PUT /companies/delete", e);
  }
}

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed out of 4`);
if (failed > 0) {
  console.log("\nSome tests failed. Check output above for details.");
  Deno.exit(1);
} else {
  console.log("\nAll sandbox compliance tests passed!");
}
