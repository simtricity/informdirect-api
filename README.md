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
import { InformDirectClient } from "jsr:@simtricity/informdirect";
```

Or add to your `deno.json`:

```json
{
  "imports": {
    "@simtricity/informdirect": "jsr:@simtricity/informdirect@^0.1.0"
  }
}
```

### From source

```bash
git clone https://github.com/simtricity/informdirect-api.git
cd informdirect-api
cp .env.example .env
# Edit .env with your API key
```

## Library Usage

```ts
import { InformDirectClient } from "@simtricity/informdirect";

const client = new InformDirectClient({
  apiKey: "your-api-key",
  // baseUrl defaults to sandbox; set to BASE_URLS.production for live
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

## CLI Usage

Set your API key in a `.env` file or environment variable:

```bash
export INFORM_DIRECT_API_KEY=your-key-here
```

Then run commands via `deno task`:

```bash
deno task cli authenticate
deno task cli list-companies
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
| `--base-url` | | Override API base URL |
| `--save-registers` | | Save registers on removal |
| `--save-documents` | | Save documents on removal |
| `--help` | `-h` | Show help |

## Sandbox Testing

Inform Direct requires successful sandbox API calls before granting a production key. The test runner executes all four required operations:

```bash
deno task test:sandbox
```

This runs:
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

## Development

```bash
deno task check          # Type-check all entry points
deno task cli --help     # CLI help
deno task test:sandbox   # Run sandbox compliance tests
```

## License

MIT - see [LICENSE](./LICENSE)
