/**
 * Tests for ToolRegistry (Registry Pattern).
 */

import { describe, it, expect, vi } from "vitest";
import { ToolRegistry } from "../../src/tools/registry.js";
import { z } from "zod";
import { BaseTool, type ToolResponse } from "../../src/tools/base.tool.js";

const DummySchema = z.object({
  value: z.string(),
});

class DummyTool extends BaseTool<typeof DummySchema.shape, string> {
  readonly name: string;
  readonly description = "dummy";
  readonly schema = DummySchema;

  constructor(name: string) {
    super();
    this.name = name;
  }

  protected async execute(args: { value: string }): Promise<string> {
    return args.value;
  }

  protected formatResult(result: string): ToolResponse {
    return { content: [{ type: "text", text: result }] };
  }
}

describe("ToolRegistry", () => {
  it("should register a tool and list its name", () => {
    const registry = new ToolRegistry();
    registry.register(new DummyTool("tool_a"));

    expect(registry.getToolNames()).toEqual(["tool_a"]);
  });

  it("should register multiple tools", () => {
    const registry = new ToolRegistry();
    registry.register(new DummyTool("tool_a"));
    registry.register(new DummyTool("tool_b"));

    expect(registry.getToolNames()).toEqual(["tool_a", "tool_b"]);
  });

  it("should throw when registering a duplicate tool name", () => {
    const registry = new ToolRegistry();
    registry.register(new DummyTool("tool_a"));

    expect(() => registry.register(new DummyTool("tool_a"))).toThrow(
      'Tool "tool_a" is already registered',
    );
  });

  it("should bind tools to an McpServer instance", () => {
    const registry = new ToolRegistry();
    registry.register(new DummyTool("tool_a"));

    // Mock McpServer with a registerTool() method
    const mockServer = {
      registerTool: vi.fn(),
    };

    registry.bindToServer(mockServer as any);

    expect(mockServer.registerTool).toHaveBeenCalledOnce();
    expect(mockServer.registerTool.mock.calls[0][0]).toBe("tool_a");
    expect(mockServer.registerTool.mock.calls[0][1]).toEqual({
      description: "dummy",
      inputSchema: DummySchema.shape,
    });
  });
});
