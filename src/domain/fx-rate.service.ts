/**
 * FxRateService — Facade Pattern (GoF).
 *
 * Provides a simplified, deterministic interface for all exchange rate
 * operations. Orchestrates the RateProvider strategy and encapsulates
 * business logic such as direction resolution, rate extraction, and
 * currency conversion.
 */

import {
  Currency,
  ExchangeDirection,
  type ExchangeResult,
  type BankOfCanadaObservation,
  type RateProvider,
  createExchangeResult,
} from "./types.js";

export class FxRateService {
  constructor(private readonly provider: RateProvider) {}

  /**
   * Get exchange rate for a specific date with optional amount conversion.
   *
   * @param from - Source currency
   * @param to - Target currency
   * @param date - Date in YYYY-MM-DD format
   * @param amount - Optional amount to convert
   * @returns Frozen ExchangeResult value object, or null if no data found
   */
  async getRateForDate(
    from: Currency,
    to: Currency,
    date: string,
    amount?: number,
  ): Promise<ExchangeResult | null> {
    const direction = this.resolveDirection(from, to);
    const observations = await this.provider.getObservations(
      direction,
      date,
      date,
    );

    const obs = observations.find((o) => o.d === date);
    if (!obs) return null;

    const rate = this.extractRate(obs, direction);
    if (rate === null) return null;

    return createExchangeResult({
      rateDate: date,
      rate,
      fromCurrency: from,
      toCurrency: to,
      amount,
      convertedAmount:
        amount !== undefined
          ? Number((amount * rate).toFixed(4))
          : undefined,
    });
  }

  /**
   * Resolve the exchange direction enum from a currency pair.
   * @throws Error if the currency pair is unsupported
   */
  private resolveDirection(
    from: Currency,
    to: Currency,
  ): ExchangeDirection {
    if (from === Currency.USD && to === Currency.CAD)
      return ExchangeDirection.USD_TO_CAD;
    if (from === Currency.CAD && to === Currency.USD)
      return ExchangeDirection.CAD_TO_USD;
    throw new Error(`Unsupported currency pair: ${from} to ${to}`);
  }

  /**
   * Extract the numeric rate from a Bank of Canada observation.
   */
  private extractRate(
    obs: BankOfCanadaObservation,
    seriesName: string,
  ): number | null {
    const data = obs[seriesName];
    if (data && typeof data === "object" && "v" in data) {
      return parseFloat(data.v);
    }
    return null;
  }
}
