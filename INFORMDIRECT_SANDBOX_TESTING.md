# Inform Direct Sandbox API — Testing Notes

Captured during initial integration development, February 2026.

## API Overview

Inform Direct is a UK company secretarial platform. Their Integration API allows external systems (e.g. Practice Management Systems) to sync company data with Inform Direct accounts.

To obtain a **production API key**, you must first pass sandbox compliance testing by making successful authenticated calls to all four company endpoints.

## Environments

| Environment | Base URL |
|---|---|
| Sandbox | `https://sandbox-api.informdirect.co.uk` |
| Production | `https://api.informdirect.co.uk` |

Swagger/OpenAPI spec available at: `https://api.informdirect.co.uk/swagger/docs/v1`

## Authentication

### Endpoint: POST /authenticate

Request:
```json
{ "ApiKey": "your-sandbox-api-key" }
```

Response (200):
```json
{
  "AccessToken": "eyJhbGciOiJIUzI1NiIs...",
  "RefreshToken": "HEAvgJyhCeg22Sx4P3R4..."
}
```

- Access token is a JWT, valid for **15 minutes**
- Include in all subsequent requests as: `Authorization: Bearer {AccessToken}`
- The API accepts both `ApiKey` (PascalCase, per spec) and `apiKey` (camelCase) in the request body — but use `ApiKey` to match the official spec

### Endpoint: POST /refresh

Request:
```json
{ "RefreshToken": "your-refresh-token" }
```

Response: same shape as `/authenticate` — new `AccessToken` and `RefreshToken`.

Use this when a request returns 401. Store the refresh token from the original auth call.

### Endpoint: POST /logout

Request:
```json
{ "RefreshToken": "your-refresh-token" }
```

Invalidates the current token pair.

## Company Endpoints

All responses use **PascalCase** field names.

### GET /companies — List all companies

No request body. Returns:
```json
{
  "Companies": [
    {
      "CompanyNumber": "00006400",
      "Name": "THE GIRLS' DAY SCHOOL TRUST",
      "PublicUrl": "/c/5WGRqGM5"
    }
  ]
}
```

### GET /companies/{companyNumber} — Get single company

Path parameter: UK Companies House number (e.g. `00006400`).

Returns the **same shape** as the list endpoint — a `Companies` array, but with one element:
```json
{
  "Companies": [
    {
      "CompanyNumber": "00006400",
      "Name": "THE GIRLS' DAY SCHOOL TRUST",
      "PublicUrl": "/c/5WGRqGM5"
    }
  ]
}
```

Note: this is an array, not a single object. Your client should extract `Companies[0]`.

### POST /companies/add — Add a company

Request:
```json
{
  "CompanyNumber": "00014259",
  "AuthenticationCode": "optional"
}
```

Success (201):
```json
{ "Message": "Company added with no authentication code." }
```

Possible errors:
- **404**: `"Company could not be found."` — invalid or unrecognised company number
- **422**: `"Dissolved companies cannot be added to Inform Direct."` — company exists at Companies House but is dissolved
- **422**: `"Company already exists."` — already in your portfolio
- **429**: `"This end point is not meant for bulk uploading, please contact our support team to bulk upload companies."` — rate limited (see below)

### PUT /companies/delete — Remove a company

Note: this is a **PUT**, not DELETE.

Request:
```json
{
  "CompanyNumber": "00014259",
  "SaveRegisters": false,
  "SaveDocuments": false
}
```

`SaveRegisters` and `SaveDocuments` are optional booleans.

Success (200):
```json
{ "Message": "Company deleted." }
```

Possible errors:
- **422**: `"Company has not been deleted as it is the last on the account."` — the API requires at least one company to remain on the account at all times

## Sandbox Behaviour & Quirks

### Rate Limiting on /companies/add

The add endpoint has aggressive rate limiting. After 2-3 rapid add calls, you'll receive a 429:
```json
{ "Message": "This end point is not meant for bulk uploading, please contact our support team to bulk upload companies." }
```

**Cooldown period**: appears to be **5+ minutes**. During testing, 30-second and 2-minute waits were insufficient. The rate limit cleared after approximately 5 minutes.

**Recommendation**: Space out add calls. Don't run the sandbox test repeatedly in quick succession.

### Cannot Remove Last Company

The API enforces a minimum of one company on the account. Attempting to remove the last company returns 422. This means:
- The sandbox test must add a *new* company first, then remove it (leaving the original)
- If you accidentally remove all but one, you must add another before you can remove the remaining one

### Initial Sandbox State

A fresh sandbox account comes with one placeholder company:
- Number: `01234567`
- Name: `SANDBOX ONE LIMITED`

**Important**: `01234567` is NOT a real Companies House number. If you remove it, you cannot re-add it (404 "Company could not be found"). You'll need to add a real company number instead.

### Known Working Test Company Numbers

Tested against the sandbox — these are real Companies House numbers that can be added/removed:

| Number | Name | Notes |
|---|---|---|
| `00006400` | THE GIRLS' DAY SCHOOL TRUST | Works for add/remove |
| `00014259` | HSBC BANK PLC | Works for add/remove — used as default test company |

Numbers that do NOT work:
| Number | Error | Reason |
|---|---|---|
| `01234567` | 404 | Sandbox placeholder, not a real CH number |
| `00000006` | 404 | Not found at Companies House |
| `12345678` | 422 | Dissolved company |
| `SC123456` | 422 | Dissolved company |

## Sandbox Compliance Test Sequence

To pass sandbox compliance and qualify for a production key, all four operations must succeed:

```
Step 1: POST /companies/add       — Add a test company (e.g. 00014259)
Step 2: GET  /companies            — List companies, verify the added company appears
Step 3: GET  /companies/00014259   — Get single company details
Step 4: PUT  /companies/delete     — Remove the test company
```

Our test runner (`deno task test:sandbox`) executes this sequence automatically.

### Pre-conditions for a Clean Test Run

1. The sandbox account must have at least one existing company (so removal in step 4 doesn't fail)
2. The test company (`00014259`) must NOT already be in the portfolio (otherwise add returns 422)
3. No recent add calls within the last 5 minutes (otherwise 429 rate limit)

## Requesting Production Access

Once sandbox testing passes, email `support@informdirect.co.uk` with:

1. Your organisation name
2. The last 6 characters of your **sandbox** API key
3. The last 6 characters of your **production** API key (generated in your Inform Direct account)

Their technical team will validate your sandbox call logs before enabling the production key.
