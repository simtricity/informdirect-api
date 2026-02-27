/**
 * Inform Direct Integration API — typed Deno client with automatic auth management.
 *
 * @example
 * ```ts
 * import { InformDirectClient } from "@simtricity/informdirect-api";
 *
 * const client = new InformDirectClient({ apiKey: Deno.env.get("INFORM_DIRECT_API_KEY")! });
 * const companies = await client.getCompanies();
 * console.log(companies);
 * ```
 *
 * @module
 */

export * from "./lib/mod.ts";
