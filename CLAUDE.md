# @simtricity/informdirect

Typed Deno client library + CLI for the Inform Direct Integration API (UK company secretarial platform).

## Project Structure

- `lib/` — Reusable library (client, types, errors). No env/dotenv deps — safe for webapp import.
- `cli/` — CLI tool that wraps the library. Loads `.env` and parses args.
- `tests/` — Sandbox compliance test runner.
- `mod.ts` — Top-level barrel export for the library.

## Key Commands

```bash
deno task check          # Type-check all entry points
deno task cli <command>  # Run CLI (see deno task cli --help)
deno task test:sandbox   # Run 4-step sandbox compliance test
```

## Inform Direct API

- Sandbox: `https://sandbox-api.informdirect.co.uk`
- Production: `https://api.informdirect.co.uk`
- Auth: POST `/authenticate` with `{ ApiKey }` returns `{ AccessToken, RefreshToken }`
- All API field names are **PascalCase** on the wire
- Access tokens valid 15 minutes; client auto-refreshes on 401
- Swagger spec: `https://api.informdirect.co.uk/swagger/docs/v1`

## Sandbox Quirks

- `/companies/add` has rate limiting (429) — wait a few minutes between rapid add calls
- Cannot remove the last company on an account (422)
- `01234567` is a sandbox placeholder, not a real Companies House number
- `00014259` (HSBC BANK PLC) is a known-good test company for add/remove cycles
- `00006400` (THE GIRLS' DAY SCHOOL TRUST) is the current base company in the sandbox

## Environment Variables

- `INFORM_DIRECT_API_KEY` — required, stored in `.env` (gitignored)
- `INFORM_DIRECT_BASE_URL` — optional, defaults to sandbox
- `TEST_COMPANY_NUMBER` — optional, defaults to `00014259` for sandbox tests

## Publishing

- Package: `@simtricity/informdirect` on JSR
- License: MIT
- GitHub Actions workflow at `.github/workflows/publish.yml` triggers on `v*` tags
- **Do not publish or push version tags without Damon's explicit authorisation**
- `deno publish --dry-run --allow-dirty` to validate before publishing
- Only `lib/`, `mod.ts`, `LICENSE`, and `deno.json` are included in the published package

## Development Notes

- Follow Simtricity conventions: caret versioning, JSR packages preferred, centralized imports in deno.json
- The `lib/` layer must stay env-agnostic (no dotenv, no Deno.env) — only CLI and tests load env
- API types use PascalCase to match the wire format; internal config uses camelCase
- Comment any fallback mechanisms with `// fallback: {explanation}`
