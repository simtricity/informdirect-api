/**
 * Inform Direct Sandbox API — Auth Test
 *
 * Proves we can authenticate against the sandbox API and receive tokens.
 *
 * Run with:
 *   deno run --allow-net --allow-env --allow-read auth-test.ts
 */

import "@std/dotenv/load";

const BASE_URL = "https://sandbox-api.informdirect.co.uk";
const API_KEY = Deno.env.get("INFORM_DIRECT_API_KEY");

if (!API_KEY) {
  console.error("Missing INFORM_DIRECT_API_KEY in environment / .env file");
  Deno.exit(1);
}

console.log(`Inform Direct Sandbox Auth Test`);
console.log(`Base URL : ${BASE_URL}`);
console.log(`API Key  : ...${API_KEY.slice(-6)}`);
console.log();

// --- Step 1: Authenticate ---------------------------------------------------

console.log("1. POST /authenticate");

const authRes = await fetch(`${BASE_URL}/authenticate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apiKey: API_KEY }),
});

console.log(`   Status: ${authRes.status} ${authRes.statusText}`);

if (!authRes.ok) {
  const body = await authRes.text();
  console.error(`   Auth failed: ${body.slice(0, 500)}`);
  Deno.exit(1);
}

const authBody = await authRes.json();
const accessToken: string = authBody.AccessToken ?? authBody.accessToken ?? authBody.access_token;
const refreshToken: string = authBody.RefreshToken ?? authBody.refreshToken ?? authBody.refresh_token ?? "";

if (!accessToken) {
  console.error("   No access token in response. Full body:");
  console.error(JSON.stringify(authBody, null, 2));
  Deno.exit(1);
}

console.log(`   Access token  : ...${accessToken.slice(-10)}`);
console.log(`   Refresh token : ...${refreshToken.slice(-10)}`);
console.log(`   Auth succeeded!\n`);

// --- Step 2: Quick smoke test — list companies ------------------------------

console.log("2. GET /companies (smoke test with token)");

const companiesRes = await fetch(`${BASE_URL}/companies`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

console.log(`   Status: ${companiesRes.status} ${companiesRes.statusText}`);

const companiesBody = await companiesRes.json();
console.log(`   Response:`);
console.log(JSON.stringify(companiesBody, null, 2));

console.log("\nDone.");
