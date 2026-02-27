#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Raw fetch example — demonstrates the Inform Direct API without the client library.
 *
 * Useful for understanding the underlying HTTP calls that the library abstracts.
 * Uses the sandbox API by default.
 *
 * Run with:
 *   deno run --allow-net --allow-env --allow-read examples/raw-fetch.ts
 */

import "@std/dotenv/load";

const BASE_URL = "https://sandbox-api.informdirect.co.uk";
const API_KEY = Deno.env.get("INFORM_DIRECT_SANDBOX_API_KEY");

if (!API_KEY) {
  console.error(
    "Missing INFORM_DIRECT_SANDBOX_API_KEY in environment / .env file",
  );
  Deno.exit(1);
}

console.log(`Inform Direct — Raw Fetch Example`);
console.log(`Base URL : ${BASE_URL}`);
console.log(`API Key  : ...${API_KEY.slice(-6)}`);
console.log();

// --- Step 1: Authenticate ---------------------------------------------------

console.log("1. POST /authenticate");

const authRes = await fetch(`${BASE_URL}/authenticate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ApiKey: API_KEY }),
});

console.log(`   Status: ${authRes.status} ${authRes.statusText}`);

if (!authRes.ok) {
  console.error(`   Auth failed: ${authRes.status} ${authRes.statusText}`);
  Deno.exit(1);
}

const { AccessToken, RefreshToken } = await authRes.json();

console.log(`   Access token  : ...${AccessToken.slice(-6)}`);
console.log(`   Refresh token : ...${RefreshToken.slice(-6)}`);
console.log(`   Auth succeeded!\n`);

// --- Step 2: List companies -------------------------------------------------

console.log("2. GET /companies");

const companiesRes = await fetch(`${BASE_URL}/companies`, {
  headers: { Authorization: `Bearer ${AccessToken}` },
});

console.log(`   Status: ${companiesRes.status} ${companiesRes.statusText}`);

const { Companies } = await companiesRes.json();
for (const c of Companies) {
  console.log(`   ${c.CompanyNumber}  ${c.Name}`);
}

// --- Step 3: Logout ---------------------------------------------------------

console.log("\n3. POST /logout");

const logoutRes = await fetch(`${BASE_URL}/logout`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ RefreshToken }),
});
await logoutRes.body?.cancel();

console.log(`   Status: ${logoutRes.status} ${logoutRes.statusText}`);
console.log("\nDone.");
