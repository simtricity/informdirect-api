# @simtricity/informdirect

A typed Deno client library and CLI for the [Inform Direct](https://www.informdirect.co.uk/) Integration API — the UK company secretarial platform.

## Features

- Typed client with automatic authentication and token refresh
- CLI for quick terminal access to all endpoints
- PascalCase types matching the API wire format — zero-cost serialization
- Company number validation (UK Companies House format)
- HTTPS enforcement
- No runtime dependencies beyond Deno standard library

## Installation

### As a Deno dependency

```ts
import { InformDirectClient } from "jsr:@simtricity/informdirect-api";
```

Or add to your `deno.json`:

```json
{
  "imports": {
    "@simtricity/informdirect-api": "jsr:@simtricity/informdirect-api@^0.1.0"
  }
}
```

### From source

```bash
git clone https://github.com/simtricity/informdirect-api.git
cd informdirect-api
cp .env.example .env
# Edit .env with your API keys
```

## Library Usage

```ts
import { InformDirectClient, BASE_URLS } from "@simtricity/informdirect-api";

const client = new InformDirectClient({
  apiKey: "your-api-key",
  baseUrl: BASE_URLS.production, // or BASE_URLS.sandbox for testing
});

// List all companies
const companies = await client.getCompanies();
console.log(companies);

// Get a single company
const company = await client.getCompany("00014259");

// Add a company
await client.addCompany("00014259", "optional-auth-code");

// Remove a company
await client.removeCompany("00014259", {
  saveRegisters: false,
  saveDocuments: false,
});

// Explicit auth (normally handled automatically)
const tokens = await client.authenticate();

// Logout
await client.logout();
```

Authentication is lazy — the first API call triggers it automatically. If a request returns 401, the client refreshes the token (or re-authenticates as a fallback) and retries once.

See `examples/` for complete runnable examples:
- `examples/read-only.ts` — library client usage (safe for production)
- `examples/raw-fetch.ts` — raw fetch without the library

## CLI Usage

The CLI defaults to **production**. Use `--sandbox` to switch to the sandbox environment.

Set your API keys in a `.env` file:

```bash
INFORM_DIRECT_API_KEY=your-production-key
INFORM_DIRECT_SANDBOX_API_KEY=your-sandbox-key
```

Then run commands via `deno task`:

```bash
deno task cli list-companies                          # production
deno task cli --sandbox list-companies                # sandbox
deno task cli get-company -c 00014259
deno task cli add-company -c 00014259 --auth-code ABC123
deno task cli remove-company -c 00014259
deno task cli --help
```

### CLI Options

| Flag | Alias | Description |
|---|---|---|
| `--company` | `-c` | Company number (8 digits or prefix + 6 digits) |
| `--auth-code` | `-a` | Authentication code (for add-company) |
| `--sandbox` | | Use sandbox environment (default: production) |
| `--save-registers` | | Save registers on removal |
| `--save-documents` | | Save documents on removal |
| `--help` | `-h` | Show help |

## Testing

```bash
deno test tests/unit-test.ts    # Offline unit tests (validation, HTTPS enforcement)
deno task test:prod             # Read-only tests against production
deno task test:sandbox          # Full compliance test against sandbox (adds/removes a company)
deno task check                 # Type-check all entry points
```

### Sandbox Compliance

Inform Direct requires successful sandbox API calls before granting a production key. The sandbox test runner executes all four required operations:

1. **Add company** — `POST /companies/add`
2. **List companies** — `GET /companies`
3. **Get company** — `GET /companies/{num}`
4. **Remove company** — `PUT /companies/delete`

See [INFORMDIRECT_SANDBOX_TESTING.md](./INFORMDIRECT_SANDBOX_TESTING.md) for detailed API documentation and sandbox behaviour notes.

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/authenticate` | POST | Authenticate with API key |
| `/refresh` | POST | Refresh access token |
| `/logout` | POST | Invalidate tokens |
| `/companies` | GET | List all companies |
| `/companies/{num}` | GET | Get single company |
| `/companies/add` | POST | Add a company |
| `/companies/delete` | PUT | Remove a company |

All request/response fields use PascalCase. Access tokens are valid for 15 minutes.

- Sandbox: `https://sandbox-api.informdirect.co.uk`
- Production: `https://api.informdirect.co.uk`

## License

MIT - see [LICENSE](./LICENSE)
