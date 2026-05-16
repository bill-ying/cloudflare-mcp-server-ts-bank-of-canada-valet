/**
 * Domain Value Objects and Interfaces for the Bank of Canada MCP Server.
 *
 * These types form the core domain model and are consumed by providers,
 * services, and tools throughout the application.
 */

/**
 * Supported currencies for exchange rate lookup.
 */
export enum Currency {
  USD = "USD",
  CAD = "CAD",
}

/**
 * Direction of currency exchange and corresponding Bank of Canada series name.
 */
export enum ExchangeDirection {
  USD_TO_CAD = "FXUSDCAD",
  CAD_TO_USD = "FXCADUSD",
}

/**
 * Value Object: Immutable result of an exchange rate lookup.
 * Ideal for audit trails in regulated financial environments.
 */
export interface ExchangeResult {
  readonly rateDate: string;
  readonly rate: number;
  readonly fromCurrency: Currency;
  readonly toCurrency: Currency;
  readonly amount?: number;
  readonly convertedAmount?: number;
}

/**
 * Raw observation from the Bank of Canada Valet API.
 */
export interface BankOfCanadaObservation {
  readonly d: string; // date in YYYY-MM-DD format
  readonly [key: string]: string | { v: string }; // series data
}

/**
 * Strategy interface (GoF Strategy Pattern).
 *
 * Decouples the data fetching mechanism from the service layer.
 * Implement this interface to swap data sources (e.g., mock, cache, live API).
 */
export interface RateProvider {
  getObservations(
    seriesName: string,
    startDate?: string,
    endDate?: string,
  ): Promise<BankOfCanadaObservation[]>;
}

/**
 * Factory function to create a frozen (immutable) ExchangeResult value object.
 */
export function createExchangeResult(
  params: ExchangeResult,
): Readonly<ExchangeResult> {
  return Object.freeze({ ...params });
}
