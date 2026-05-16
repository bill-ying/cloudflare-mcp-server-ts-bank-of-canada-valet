/**
 * GetRateTool — Concrete Tool (GoF Template Method).
 *
 * Implements the get_rate MCP tool that fetches exchange rates
 * between USD and CAD for a specific date from Bank of Canada.
 */

import { z } from "zod";
import { BaseTool, type ToolResponse } from "./base.tool.js";
import { Currency, type ExchangeResult } from "../domain/types.js";
import { FxRateService } from "../domain/fx-rate.service.js";

const GetRateSchema = z.object({
  from_currency: z
    .nativeEnum(Currency)
    .describe("Source currency (USD or CAD)"),
  to_currency: z
    .nativeEnum(Currency)
    .describe("Target currency (USD or CAD)"),
  date: z.string().describe("Date in YYYY-MM-DD format"),
  amount: z.number().optional().describe("Optional amount to convert"),
});

type GetRateInput = z.infer<typeof GetRateSchema>;

export class GetRateTool extends BaseTool<
  typeof GetRateSchema.shape,
  ExchangeResult | null
> {
  readonly name = "get_rate";
  readonly description =
    "Get the exchange rate between USD and CAD for a specific date from Bank of Canada.";
  readonly schema = GetRateSchema;

  constructor(private readonly service: FxRateService) {
    super();
  }

  protected async execute(
    args: GetRateInput,
  ): Promise<ExchangeResult | null> {
    return this.service.getRateForDate(
      args.from_currency,
      args.to_currency,
      args.date,
      args.amount,
    );
  }

  protected formatResult(result: ExchangeResult | null): ToolResponse {
    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: "No exchange rate data available for that date.",
          },
        ],
      };
    }

    let text = `Exchange rate on ${result.rateDate}: 1 ${result.fromCurrency} = ${result.rate} ${result.toCurrency}`;
    if (
      result.amount !== undefined &&
      result.convertedAmount !== undefined
    ) {
      text += `\n${result.amount} ${result.fromCurrency} = ${result.convertedAmount} ${result.toCurrency}`;
    }

    return { content: [{ type: "text", text }] };
  }
}
