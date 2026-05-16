/**
 * Cloudflare Workers Entry Point.
 *
 * Uses Cloudflare's `createMcpHandler()` from the Agents SDK to serve
 * a stateless MCP server via the Streamable HTTP transport.
 *
 * Per MCP SDK 1.26.0+, we create a new McpServer instance per request
 * to ensure complete isolation between clients.
 *
 * Architecture:
 *   - Factory function `createServer()` wires GoF components per request
 *   - ToolRegistry (Registry Pattern) binds tools to McpServer
 *   - BankOfCanadaProvider (Strategy) injected into FxRateService (Facade)
 *   - GetRateTool (Template Method) handles get_rate tool calls
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BankOfCanadaProvider } from "./providers/bank-of-canada.provider.js";
import { FxRateService } from "./domain/fx-rate.service.js";
import { GetRateTool } from "./tools/get-rate.tool.js";
import { ToolRegistry } from "./tools/registry.js";

export interface Env {
  // Bindings
}

/**
 * Factory: Creates a fully-wired McpServer instance.
 * Called per-request to comply with MCP SDK 1.26.0+ security requirements.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: "bank-of-canada-mcp",
    version: "1.0.0",
  });

  // Wire GoF components: Strategy → Facade → Tool → Registry
  const provider = new BankOfCanadaProvider();
  const service = new FxRateService(provider);
  const registry = new ToolRegistry();

  registry.register(new GetRateTool(service));

  registry.bindToServer(server);

  return server;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // In stateless mode, only POST is valid. GET (SSE) and DELETE (session
    // teardown) are session-oriented and must be rejected to prevent
    // Cloudflare's hang detection from firing on dead SSE streams.
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    await server.connect(transport);

    return transport.handleRequest(request);
  },
} satisfies ExportedHandler<Env>;
