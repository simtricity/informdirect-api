/**
 * Inform Direct Sandbox Compliance Test
 *
 * Runs the 4 required sandbox operations to qualify for a production key:
 *   1. Add company
 *   2. Get companies (list)
 *   3. Get company (single)
 *   4. Remove company
 *
 * Includes cleanup on partial failure to avoid polluting sandbox state.
 *
 * Env vars:
 *   INFORM_DIRECT_SANDBOX_API_KEY  — sandbox API key (required)
 *   TEST_COMPANY_NUMBER            — company to add/remove (default: 00014259)
 *
 * Run: deno task test:sandbox
 */

import "@std/dotenv/load";
import { assertEquals, assertExists } from "@std/assert";
import {
  BASE_URLS,
  InformDirectClient,
  InformDirectError,
} from "../lib/mod.ts";

const API_KEY = Deno.env.get("INFORM_DIRECT_SANDBOX_API_KEY");
if (!API_KEY) {
  throw new Error("INFORM_DIRECT_SANDBOX_API_KEY is required");
}

const TEST_COMPANY = Deno.env.get("TEST_COMPANY_NUMBER") ?? "00014259";

Deno.test("sandbox compliance — add, list, get, remove", async (t) => {
  const client = new InformDirectClient({
    apiKey: API_KEY,
    baseUrl: BASE_URLS.sandbox,
  });
  let companyAdded = false;

  try {
    // --- Step 1: Add company ---
    await t.step("add company", async () => {
      try {
        const result = await client.addCompany(TEST_COMPANY);
        assertEquals(typeof result.Message, "string");
        companyAdded = true;
      } catch (e) {
        if (e instanceof InformDirectError && e.status === 422) {
          // Company may already be in portfolio — verify
          const companies = await client.getCompanies();
          const exists = companies.some(
            (c) => c.CompanyNumber === TEST_COMPANY,
          );
          if (exists) {
            companyAdded = true;
            console.log(
              `    (company already in portfolio — treating as pass)`,
            );
            return;
          }
        }
        throw e;
      }
    });

    // --- Step 2: List companies ---
    await t.step("list companies — verify test company present", async () => {
      const companies = await client.getCompanies();
      assertExists(companies, "should return companies");
      assertEquals(companies.length > 0, true, "should have at least one");
      const found = companies.some((c) => c.CompanyNumber === TEST_COMPANY);
      assertEquals(found, true, `${TEST_COMPANY} should be in the list`);
    });

    // --- Step 3: Get single company ---
    await t.step("get company — single company details", async () => {
      const company = await client.getCompany(TEST_COMPANY);
      assertExists(company, `${TEST_COMPANY} should be found`);
      assertEquals(company!.CompanyNumber, TEST_COMPANY);
      assertExists(company!.Name, "Name should be present");
    });

    // --- Step 4: Remove company ---
    await t.step("remove company", async () => {
      try {
        const result = await client.removeCompany(TEST_COMPANY);
        assertEquals(typeof result.Message, "string");
        companyAdded = false;
      } catch (e) {
        if (
          e instanceof InformDirectError &&
          e.status === 422 &&
          (e.body as { Message?: string })?.Message?.includes(
            "last on the account",
          )
        ) {
          console.log(
            `    WARNING: Cannot remove — test company is the last on the account.`,
          );
          console.log(
            `    The remove endpoint responded correctly (422), but the test`,
          );
          console.log(
            `    was not fully exercised. Ensure the sandbox has at least`,
          );
          console.log(
            `    one other company before running this test.`,
          );
          companyAdded = false; // nothing to clean up
          return;
        }
        throw e;
      }
    });
  } finally {
    // Cleanup: if we added the company but never removed it, try to clean up
    if (companyAdded) {
      try {
        await client.removeCompany(TEST_COMPANY);
      } catch {
        console.log(
          `    WARNING: Cleanup failed — ${TEST_COMPANY} may still be in the sandbox portfolio`,
        );
      }
    }
    await client.logout();
  }
});
