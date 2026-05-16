/**
 * Tests for GetRateTool (Concrete Tool).
 *
 * Verifies the tool's integration with FxRateService via a mock provider.
 */

import { describe, it, expect } from "vitest";
import { GetRateTool } from "../../src/tools/get-rate.tool.js";
import { FxRateService } from "../../src/domain/fx-rate.service.js";
import {
  Currency,
  type BankOfCanadaObservation,
  type RateProvider,
} from "../../src/domain/types.js";

class MockProvider implements RateProvider {
  async getObservations(
    seriesName: string,
    startDate?: string,
  ): Promise<BankOfCanadaObservation[]> {
    if (seriesName === "FXUSDCAD" && startDate === "2024-01-15") {
      return [{ d: "2024-01-15", FXUSDCAD: { v: "1.3456" } }];
    }
    return [];
  }
}

describe("GetRateTool", () => {
  const service = new FxRateService(new MockProvider());
  const tool = new GetRateTool(service);

  it("should return formatted rate text for valid input", async () => {
    const result = await tool.run({
      from_currency: "USD",
      to_currency: "CAD",
      date: "2024-01-15",
    });

    expect(result.content[0].text).toContain("1.3456");
    expect(result.content[0].text).toContain("2024-01-15");
    expect(result.isError).toBeUndefined();
  });

  it("should include conversion when amount is provided", async () => {
    const result = await tool.run({
      from_currency: "USD",
      to_currency: "CAD",
      date: "2024-01-15",
      amount: 250,
    });

    expect(result.content[0].text).toContain("250 USD = 336.4 CAD");
  });

  it("should return 'no data' message for missing dates", async () => {
    const result = await tool.run({
      from_currency: "USD",
      to_currency: "CAD",
      date: "2024-12-25",
    });

    expect(result.content[0].text).toContain("No exchange rate data");
  });

  it("should reject invalid currency values", async () => {
    await expect(
      tool.run({
        from_currency: "EUR",
        to_currency: "CAD",
        date: "2024-01-15",
      }),
    ).rejects.toThrow();
  });

  it("should reject missing required fields", async () => {
    await expect(
      tool.run({ from_currency: "USD" }),
    ).rejects.toThrow();
  });

  it("should have correct tool metadata", () => {
    expect(tool.name).toBe("get_rate");
    expect(tool.description).toContain("exchange rate");
    expect(tool.schema).toBeDefined();
  });
});
