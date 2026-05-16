/**
 * ToolRegistry — Registry Pattern (GoF).
 *
 * Manages the registration and binding of MCP tools onto an
 * McpServer instance. This replaces the previous manual handler setup
 * with a clean, extensible registry that works with Cloudflare's
 * `createMcpHandler()` API.
 *
 * To add a new tool:
 *   1. Create a subclass of BaseTool
 *   2. Register it via `registry.register(new MyTool(...))`
 *   3. Call `registry.bindToServer(mcpServer)` during server creation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BaseTool } from "./base.tool.js";

export class ToolRegistry {
  private readonly tools: Map<string, BaseTool> = new Map();

  /** Register a tool. Throws if a tool with the same name already exists. */
  register(tool: BaseTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  /** Get all registered tool names. */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Bind all registered tools to an McpServer instance.
   * This uses the McpServer.tool() API to register tools with
   * their Zod schemas for automatic input validation.
   */
  bindToServer(server: McpServer): void {
    for (const tool of this.tools.values()) {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.schema.shape,
          ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
        },
        async (args: any) => {
          return tool.run(args) as any;
        },
      );
    }
  }
}
