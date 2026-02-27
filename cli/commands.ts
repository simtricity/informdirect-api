import type { InformDirectClient } from "../lib/mod.ts";
import { formatCompanyTable, formatTokenInfo } from "./format.ts";

export async function authenticate(
  client: InformDirectClient,
): Promise<void> {
  console.log("Authenticating...");
  const tokens = await client.authenticate();
  formatTokenInfo(tokens);
  console.log("Authentication successful.");
}

export async function listCompanies(
  client: InformDirectClient,
): Promise<void> {
  const companies = await client.getCompanies();
  if (companies.length === 0) {
    console.log("No companies in portfolio.");
    return;
  }
  console.log(`${companies.length} company(ies):\n`);
  formatCompanyTable(companies);
}

export async function getCompany(
  client: InformDirectClient,
  companyNumber?: string,
): Promise<void> {
  if (!companyNumber) {
    console.error("Error: --company (-c) is required");
    Deno.exit(1);
  }
  const company = await client.getCompany(companyNumber);
  if (!company) {
    console.log(`Company ${companyNumber} not found in portfolio.`);
    return;
  }
  console.log(`Company: ${company.Name}`);
  console.log(`Number:  ${company.CompanyNumber}`);
  console.log(`URL:     ${company.PublicUrl}`);
}

export async function addCompany(
  client: InformDirectClient,
  companyNumber?: string,
  authCode?: string,
): Promise<void> {
  if (!companyNumber) {
    console.error("Error: --company (-c) is required");
    Deno.exit(1);
  }
  const result = await client.addCompany(companyNumber, authCode);
  console.log(result.Message ?? "Company added successfully.");
}

export async function removeCompany(
  client: InformDirectClient,
  companyNumber?: string,
  options?: { saveRegisters?: boolean; saveDocuments?: boolean },
): Promise<void> {
  if (!companyNumber) {
    console.error("Error: --company (-c) is required");
    Deno.exit(1);
  }
  const result = await client.removeCompany(companyNumber, options);
  console.log(result.Message ?? "Company removed successfully.");
}
