#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Inform Direct CLI
 *
 * Usage:
 *   deno task cli <command> [options]
 *
 * Commands:
 *   authenticate                    Test authentication
 *   list-companies                  List all companies in portfolio
 *   get-company -c <number>         Get a single company
 *   add-company -c <number> [-a <code>]  Add a company
 *   remove-company -c <number>      Remove a company
 *
 * Options:
 *   -c, --company        Company number
 *   -a, --auth-code      Authentication code (for add-company)
 *       --base-url       Override base URL
 *       --save-registers Save registers on removal
 *       --save-documents Save documents on removal
 *   -h, --help           Show this help
 */

import "@std/dotenv/load";
import { parseArgs } from "@std/cli/parse-args";
import { InformDirectClient } from "../lib/mod.ts";
import * as commands from "./commands.ts";

const args = parseArgs(Deno.args, {
  string: ["company", "auth-code", "base-url"],
  boolean: ["help", "save-registers", "save-documents"],
  alias: { h: "help", c: "company", a: "auth-code" },
});

const command = args._[0]?.toString();

function printUsage(): void {
  console.log(`Inform Direct CLI

Usage: deno task cli <command> [options]

Commands:
  authenticate                         Test authentication
  list-companies                       List all companies
  get-company    -c <number>           Get a single company
  add-company    -c <number> [-a code] Add a company
  remove-company -c <number>           Remove a company

Options:
  -c, --company        Company number
  -a, --auth-code      Authentication code
      --base-url       Override API base URL
      --save-registers Save registers on removal
      --save-documents Save documents on removal
  -h, --help           Show this help`);
}

if (!command || args.help) {
  printUsage();
  Deno.exit(0);
}

const apiKey = Deno.env.get("INFORM_DIRECT_API_KEY");
if (!apiKey) {
  console.error(
    "Error: INFORM_DIRECT_API_KEY not set in environment or .env file",
  );
  Deno.exit(1);
}

const client = new InformDirectClient({
  apiKey,
  baseUrl: args["base-url"] || Deno.env.get("INFORM_DIRECT_BASE_URL"),
});

try {
  switch (command) {
    case "authenticate":
      await commands.authenticate(client);
      break;
    case "list-companies":
      await commands.listCompanies(client);
      break;
    case "get-company":
      await commands.getCompany(client, args.company);
      break;
    case "add-company":
      await commands.addCompany(client, args.company, args["auth-code"]);
      break;
    case "remove-company":
      await commands.removeCompany(client, args.company, {
        saveRegisters: args["save-registers"],
        saveDocuments: args["save-documents"],
      });
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      printUsage();
      Deno.exit(1);
  }
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  Deno.exit(1);
}
