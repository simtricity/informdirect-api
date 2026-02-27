/**
 * Unit tests — no network required.
 *
 * Tests validation logic and constructor guards.
 *
 * Run: deno test --allow-env --allow-read tests/unit-test.ts
 */

import { assertRejects, assertThrows } from "@std/assert";
import { InformDirectClient, InformDirectError } from "../lib/mod.ts";

// --- HTTPS enforcement (#14) ---

Deno.test("constructor rejects http:// baseUrl", () => {
  assertThrows(
    () =>
      new InformDirectClient({
        apiKey: "test",
        baseUrl: "http://api.example.com",
      }),
    Error,
    "baseUrl must use HTTPS",
  );
});

Deno.test("constructor accepts https:// baseUrl", () => {
  // Should not throw
  new InformDirectClient({
    apiKey: "test",
    baseUrl: "https://api.example.com",
  });
});

Deno.test("constructor accepts default baseUrl (no baseUrl provided)", () => {
  // Should not throw — defaults to sandbox which is https
  new InformDirectClient({ apiKey: "test" });
});

// --- Company number validation (#13) ---

const validNumbers = [
  "00014259", // 8 digits — HSBC
  "00006400", // 8 digits — Girls' Day School Trust
  "12345678", // 8 digits
  "SC123456", // Scottish company
  "NI000123", // Northern Ireland
  "OC301234", // LLP
  "SO300001", // Scottish LLP
  "IP030000", // Industrial & Provident
  "RC000001", // Royal Charter
];

const invalidNumbers = [
  "1234567", // 7 digits — too short
  "123456789", // 9 digits — too long
  "ABCDEFGH", // all letters
  "SC12345", // prefix + 5 digits — too short
  "SC1234567", // prefix + 7 digits — too long
  "sc123456", // lowercase prefix
  "S1234567", // single letter prefix
  "ABC12345", // 3-letter prefix
  "", // empty
  "0001 4259", // spaces
  "00014259!", // special char
];

for (const num of validNumbers) {
  Deno.test(`validates company number: ${num}`, async () => {
    const client = new InformDirectClient({ apiKey: "test-key-not-real" });
    // Call getCompany which triggers validation before any network call.
    // It will fail on auth (no valid key), but validation should pass.
    // We check that the error is NOT a validation error.
    try {
      await client.getCompany(num);
    } catch (e) {
      if (e instanceof InformDirectError && e.status === 0) {
        throw new Error(
          `Validation rejected valid company number "${num}": ${e.message}`,
        );
      }
      // Any other error (auth failure etc.) means validation passed — that's fine
    }
  });
}

for (const num of invalidNumbers) {
  Deno.test(`rejects invalid company number: "${num}"`, async () => {
    const client = new InformDirectClient({ apiKey: "test-key-not-real" });
    await assertRejects(
      () => client.getCompany(num),
      InformDirectError,
      "Invalid company number",
    );
  });
}
