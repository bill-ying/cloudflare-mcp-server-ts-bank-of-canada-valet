/**
 * BankOfCanadaProvider — Concrete Strategy (GoF Strategy Pattern).
 *
 * Implements the RateProvider interface to fetch observations from
 * the Bank of Canada Valet API. This provider can be swapped with
 * a mock or cached implementation for testing or resilience.
 */

import type { BankOfCanadaObservation, RateProvider } from "../domain/types.js";

export class BankOfCanadaProvider implements RateProvider {
  private static readonly BASE_URL =
    "https://www.bankofcanada.ca/valet/observations";

  async getObservations(
    seriesName: string,
    startDate?: string,
    endDate?: string,
  ): Promise<BankOfCanadaObservation[]> {
    const url = new URL(
      `${BankOfCanadaProvider.BASE_URL}/${seriesName}/json`,
    );
    if (startDate) url.searchParams.append("start_date", startDate);
    if (endDate) url.searchParams.append("end_date", endDate);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Bank of Canada API responded with status ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      observations?: BankOfCanadaObservation[];
    };
    return data.observations ?? [];
  }
}
