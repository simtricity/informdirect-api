import type { AuthTokens, CompanySummary } from "../lib/mod.ts";

/** Print a table of companies to stdout. */
export function formatCompanyTable(companies: CompanySummary[]): void {
  const numWidth = Math.max(
    8,
    ...companies.map((c) => c.CompanyNumber.length),
  );
  const nameWidth = Math.max(4, ...companies.map((c) => c.Name.length));

  const header =
    `${"Number".padEnd(numWidth)}  ${"Name".padEnd(nameWidth)}  URL`;
  console.log(header);
  console.log("-".repeat(header.length));

  for (const c of companies) {
    console.log(
      `${c.CompanyNumber.padEnd(numWidth)}  ${
        c.Name.padEnd(nameWidth)
      }  ${c.PublicUrl}`,
    );
  }
}

/** Print masked token info. */
export function formatTokenInfo(tokens: AuthTokens): void {
  console.log(`  Access token  : ...${tokens.AccessToken.slice(-10)}`);
  console.log(`  Refresh token : ...${tokens.RefreshToken.slice(-10)}`);
}
