/**
 * Tests for BaseTool (Template Method Pattern).
 *
 * Verifies the template method algorithm: validate → execute → format.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { BaseTool, type ToolResponse } from "../../src/tools/base.tool.js";

/** Concrete test tool for verifying the template method. */
class TestTool extends BaseTool<typeof TestSchema.shape, string> {
  readonly name = "test_tool";
  readonly description = "A test tool";
  readonly schema = TestSchema;

  protected async execute(args: { input: string }): Promise<string> {
    return `processed:${args.input}`;
  }

  protected formatResult(result: string): ToolResponse {
    return { content: [{ type: "text", text: result }] };
  }
}

const TestSchema = z.object({
  input: z.string().describe("Test input"),
});

/** Tool that always fails in execute. */
class FailingTool extends BaseTool<typeof TestSchema.shape, string> {
  readonly name = "failing_tool";
  readonly description = "A tool that fails";
  readonly schema = TestSchema;

  protected async execute(): Promise<string> {
    throw new Error("Execution failed");
  }

  protected formatResult(result: string): ToolResponse {
    return { content: [{ type: "text", text: result }] };
  }
}

describe("BaseTool (Template Method)", () => {
  const tool = new TestTool();

  it("should validate, execute, and format in sequence", async () => {
    const result = await tool.run({ input: "hello" });

    expect(result).toEqual({
      content: [{ type: "text", text: "processed:hello" }],
    });
  });

  it("should reject invalid input via Zod validation", async () => {
    await expect(tool.run({ input: 123 })).rejects.toThrow();
  });

  it("should reject missing required fields", async () => {
    await expect(tool.run({})).rejects.toThrow();
  });

  it("should propagate execution errors", async () => {
    const failingTool = new FailingTool();
    await expect(failingTool.run({ input: "test" })).rejects.toThrow(
      "Execution failed",
    );
  });

  it("should expose name, description, and schema", () => {
    expect(tool.name).toBe("test_tool");
    expect(tool.description).toBe("A test tool");
    expect(tool.schema).toBeDefined();
  });
});
