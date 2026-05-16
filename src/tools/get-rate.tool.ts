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
  
  readonly annotations = {
    readOnlyHint: true, // Tool only fetches data, no mutations
  };

  readonly outputSchema = z.object({
    success: z.boolean().describe("True if rate data was found, false otherwise (e.g., weekends/holidays)"),
    message: z.string().optional().describe("Explanation if no data was found"),
    rateDate: z.string().optional().describe("The date the exchange rate applies to"),
    fromCurrency: z.string().optional().describe("Source currency code"),
    toCurrency: z.string().optional().describe("Target currency code"),
    rate: z.number().optional().describe("The exchange rate value"),
    amount: z.number().optional().describe("The original amount converted (if provided)"),
    convertedAmount: z.number().optional().describe("The resulting converted amount (if provided)"),
  });

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
        structuredContent: {
          success: false,
          message: "No exchange rate data available for that date."
        }
      };
    }

    let text = `Exchange rate on ${result.rateDate}: 1 ${result.fromCurrency} = ${result.rate} ${result.toCurrency}`;
    if (
      result.amount !== undefined &&
      result.convertedAmount !== undefined
    ) {
      text += `\n${result.amount} ${result.fromCurrency} = ${result.convertedAmount} ${result.toCurrency}`;
    }

    const structuredContent: Record<string, unknown> = {
      success: true,
      rateDate: result.rateDate,
      fromCurrency: result.fromCurrency,
      toCurrency: result.toCurrency,
      rate: result.rate,
    };

    if (result.amount !== undefined) {
      structuredContent.amount = result.amount;
    }
    if (result.convertedAmount !== undefined) {
      structuredContent.convertedAmount = result.convertedAmount;
    }

    return { 
      content: [{ type: "text", text }],
      structuredContent
    };
  }
}
