/**
 * Tests for BankOfCanadaProvider (Concrete Strategy).
 *
 * Uses vitest's mock to stub global fetch for deterministic testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BankOfCanadaProvider } from "../../src/providers/bank-of-canada.provider.js";

describe("BankOfCanadaProvider", () => {
  const provider = new BankOfCanadaProvider();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should construct the correct URL with series name", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        observations: [{ d: "2024-01-15", FXUSDCAD: { v: "1.35" } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await provider.getObservations("FXUSDCAD", "2024-01-15", "2024-01-15");

    const calledUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(calledUrl.pathname).toBe("/valet/observations/FXUSDCAD/json");
    expect(calledUrl.searchParams.get("start_date")).toBe("2024-01-15");
    expect(calledUrl.searchParams.get("end_date")).toBe("2024-01-15");
    expect(calledUrl.searchParams.has("output_format")).toBe(false);
  });

  it("should return observations from valid API response", async () => {
    const mockObservations = [
      { d: "2024-01-15", FXUSDCAD: { v: "1.3456" } },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ observations: mockObservations }),
      }),
    );

    const result = await provider.getObservations("FXUSDCAD", "2024-01-15");
    expect(result).toEqual(mockObservations);
  });

  it("should return empty array when no observations exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    const result = await provider.getObservations("FXUSDCAD", "2099-01-01");
    expect(result).toEqual([]);
  });

  it("should throw on non-OK API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(
      provider.getObservations("FXUSDCAD", "2024-01-15"),
    ).rejects.toThrow("Bank of Canada API responded with status 500");
  });

  it("should not include date params when not provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ observations: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await provider.getObservations("FXUSDCAD");

    const calledUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(calledUrl.searchParams.has("start_date")).toBe(false);
    expect(calledUrl.searchParams.has("end_date")).toBe(false);
  });
});
