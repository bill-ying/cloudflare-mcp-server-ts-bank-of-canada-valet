# MCP Server for Bank of Canada Exchange Rates

> **Note:** This project implements an MCP (Model Context Protocol) server to provide deterministic access to official Bank of Canada exchange rate data, deployed on Cloudflare Workers.

## Overview

This is a standalone MCP server that exposes the **Bank of Canada's Valet API** as a set of structured tools for AI agents. Built with **Gang of Four (GoF) design patterns** and deployed on **Cloudflare Workers** using the modern **Streamable HTTP** transport, it provides a standardized, secure, and auditable way for AI models to fetch and reason about historical and current exchange rates.

## Key Features

- **MCP Compliant**: Implements the Model Context Protocol using the official SDK with Streamable HTTP transport.
- **Cloudflare Workers**: Edge-deployed for low-latency, serverless execution worldwide.
- **Bank of Canada Data**: Fetches official exchange rates via the [Bank of Canada Valet API](https://www.bankofcanada.ca/valet/).
- **Full Type Safety**: Written in TypeScript with strict type checking.
- **CI/CD Pipeline**: GitHub Actions with build, test, Snyk security scan, and deploy stages.



## Getting Started

### Prerequisites

- **Node.js**: >= 22.x
- **npm**: >= 10.x
- **Wrangler CLI**: `npm install -g wrangler` (or use `npx`)

### Local Development

Start the Wrangler dev server:

```bash
npm run dev
```

The MCP server will be available at `http://localhost:8787/mcp`.

### Testing

Run the Vitest suite:

```bash
npm test
```

With watch mode:

```bash
npm run test:watch
```

### Type Checking

```bash
npm run typecheck
```

## Deployment

### Cloudflare Workers

Deploy to Cloudflare Workers using Wrangler:

```bash
npm run deploy
```

Or via GitHub Actions — pushes to `main` automatically deploy after passing build, test, and Snyk scan stages.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `SNYK_TOKEN` | Snyk API token for vulnerability scanning |

## Available Tools

### `get_rate`

Retrieves the exchange rate between USD and CAD for a specific date from Bank of Canada.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from_currency` | `"USD"` \| `"CAD"` | Yes | Source currency |
| `to_currency` | `"USD"` \| `"CAD"` | Yes | Target currency |
| `date` | `string` | Yes | Date in `YYYY-MM-DD` format |
| `amount` | `number` | No | Amount to convert |

**Example Response:**

```
Exchange rate on 2024-01-15: 1 USD = 1.3456 CAD
100 USD = 134.56 CAD
```

## CI/CD Pipeline

```text
               ┌→ Build & Type Check → Test ─┐
Push to main  ─┤                             ├→ Deploy to CF Workers
               └→ Snyk Scan ─────────────────┘
```

The pipeline skips runs when only `README.md`, `LICENSE`, or `docs/**` files change.


## MCP Server Links
```
https://mcp-server-bank-of-canada-valet.bill-ying.workers.dev/mcp
https://smithery.ai/servers/bill-ying/bank-of-canada-foreign-exchange
```


## Debugging
```
npx wrangler dev --inspector-port 9229
Launch "Attach to Wrangler (workerd)" in VS Code
npx @modelcontextprotocol/inspector
```

## License

This project is licensed under the GPLv3 License.
