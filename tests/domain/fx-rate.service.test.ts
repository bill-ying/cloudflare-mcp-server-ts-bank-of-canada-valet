/**
 * Tests for FxRateService (Facade).
 *
 * Uses a MockRateProvider (Strategy) for deterministic testing
 * without network calls.
 */

import { describe, it, expect } from "vitest";
import { FxRateService } from "../../src/domain/fx-rate.service.js";
import {
  Currency,
  type BankOfCanadaObservation,
  type RateProvider,
} from "../../src/domain/types.js";

/**
 * Mock Provider — implements RateProvider Strategy for testing.
 */
class MockRateProvider implements RateProvider {
  private readonly data: Map<string, BankOfCanadaObservation[]>;

  constructor(entries: [string, BankOfCanadaObservation[]][]) {
    this.data = new Map(entries);
  }

  async getObservations(
    seriesName: string,
    startDate?: string,
  ): Promise<BankOfCanadaObservation[]> {
    const key = `${seriesName}:${startDate ?? ""}`;
    return this.data.get(key) ?? [];
  }
}

function createMockProvider(): MockRateProvider {
  return new MockRateProvider([
    [
      "FXUSDCAD:2024-01-15",
      [{ d: "2024-01-15", FXUSDCAD: { v: "1.3456" } }],
    ],
    [
      "FXCADUSD:2024-01-15",
      [{ d: "2024-01-15", FXCADUSD: { v: "0.7432" } }],
    ],
    [
      "FXUSDCAD:2024-03-01",
      [{ d: "2024-03-01", FXUSDCAD: { v: "1.3600" } }],
    ],
  ]);
}

describe("FxRateService", () => {
  const provider = createMockProvider();
  const service = new FxRateService(provider);

  describe("getRateForDate", () => {
    it("should return rate for USD to CAD on a valid date", async () => {
      const result = await service.getRateForDate(
        Currency.USD,
        Currency.CAD,
        "2024-01-15",
      );

      expect(result).not.toBeNull();
      expect(result!.rate).toBe(1.3456);
      expect(result!.fromCurrency).toBe(Currency.USD);
      expect(result!.toCurrency).toBe(Currency.CAD);
      expect(result!.rateDate).toBe("2024-01-15");
    });

    it("should return rate for CAD to USD", async () => {
      const result = await service.getRateForDate(
        Currency.CAD,
        Currency.USD,
        "2024-01-15",
      );

      expect(result).not.toBeNull();
      expect(result!.rate).toBe(0.7432);
      expect(result!.fromCurrency).toBe(Currency.CAD);
      expect(result!.toCurrency).toBe(Currency.USD);
    });

    it("should calculate converted amount when amount is provided", async () => {
      const result = await service.getRateForDate(
        Currency.USD,
        Currency.CAD,
        "2024-01-15",
        100,
      );

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(100);
      expect(result!.convertedAmount).toBe(134.56);
    });

    it("should not include convertedAmount when amount is not provided", async () => {
      const result = await service.getRateForDate(
        Currency.USD,
        Currency.CAD,
        "2024-01-15",
      );

      expect(result).not.toBeNull();
      expect(result!.amount).toBeUndefined();
      expect(result!.convertedAmount).toBeUndefined();
    });

    it("should return null for dates with no data", async () => {
      const result = await service.getRateForDate(
        Currency.USD,
        Currency.CAD,
        "2024-12-25", // holiday
      );

      expect(result).toBeNull();
    });

    it("should throw for unsupported currency pairs", async () => {
      await expect(
        service.getRateForDate(
          "EUR" as Currency,
          Currency.CAD,
          "2024-01-15",
        ),
      ).rejects.toThrow("Unsupported currency pair: EUR to CAD");
    });

    it("should throw for same-currency pairs", async () => {
      await expect(
        service.getRateForDate(
          Currency.USD,
          Currency.USD,
          "2024-01-15",
        ),
      ).rejects.toThrow("Unsupported currency pair: USD to USD");
    });

    it("should return a frozen (immutable) result", async () => {
      const result = await service.getRateForDate(
        Currency.USD,
        Currency.CAD,
        "2024-01-15",
      );

      expect(result).not.toBeNull();
      expect(Object.isFrozen(result)).toBe(true);
    });
  });
});
