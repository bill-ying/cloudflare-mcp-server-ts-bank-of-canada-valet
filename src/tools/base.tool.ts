/**
 * BaseTool — Template Method Pattern (GoF).
 *
 * Defines the invariant algorithm skeleton for all MCP tools:
 *   1. validate (via Zod schema)
 *   2. execute (subclass-specific business logic)
 *   3. formatResult (subclass-specific response formatting)
 *
 * Subclasses override `execute()` and `formatResult()` to provide
 * tool-specific behavior while inheriting the standardized pipeline.
 */

import { z } from "zod";

/** Standard MCP tool response content item. */
export interface ToolContent {
  type: "text";
  text: string;
}

/** Standard MCP tool response shape. */
export interface ToolResponse {
  content: ToolContent[];
  isError?: boolean;
}

export abstract class BaseTool<
  TSchema extends z.ZodRawShape = z.ZodRawShape,
  TResult = unknown,
> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schema: z.ZodObject<TSchema>;

  /**
   * Template Method: validates input, executes logic, formats output.
   * This method should not be overridden by subclasses.
   */
  async run(args: unknown): Promise<ToolResponse> {
    const validatedArgs = this.schema.parse(args);
    const result = await this.execute(validatedArgs);
    return this.formatResult(result);
  }

  /** Hook: Execute tool-specific business logic. */
  protected abstract execute(
    args: z.infer<z.ZodObject<TSchema>>,
  ): Promise<TResult>;

  /** Hook: Format the result into an MCP-compliant response. */
  protected abstract formatResult(result: TResult): ToolResponse;
}
