import { describe, expect, it, vi } from "vitest";

import {
  adaptBrapiQuote,
  BrapiMarketDataGateway,
} from "./brapi-market-data-gateway";

describe("Brapi asset adapter", () => {
  it("maps provider payloads to the Finta B3 contract", () => {
    expect(
      adaptBrapiQuote(
        {
          symbol: "PETR4",
          longName: "Petroleo Brasileiro S.A. Petrobras",
          currency: "USD",
          regularMarketPrice: 38.42,
          regularMarketChange: -0.18,
          regularMarketChangePercent: -0.47,
          regularMarketTime: 1_741_632_000,
          logourl: "https://example.com/petr4.png",
        },
        "PETR4",
      ),
    ).toEqual({
      ticker: "PETR4",
      name: "Petroleo Brasileiro S.A. Petrobras",
      market: "B3",
      currency: "USD",
      price: 38.42,
      change: -0.18,
      changePercent: -0.47,
      quotedAt: "2025-03-10T18:40:00.000Z",
      logoUrl: "https://example.com/petr4.png",
    });
  });

  it("normalizes missing optional B3 fields", () => {
    expect(
      adaptBrapiQuote(
        {
          shortName: "Vale",
          regularMarketPrice: 55.2,
          regularMarketChange: 0.12,
          regularMarketChangePercent: 0.21,
          regularMarketTime: "invalid-date",
          logourl: " ",
        },
        "VALE3",
      ),
    ).toEqual({
      ticker: "VALE3",
      name: "Vale",
      market: "B3",
      currency: "BRL",
      price: 55.2,
      change: 0.12,
      changePercent: 0.21,
      quotedAt: "1970-01-01T00:00:00.000Z",
      logoUrl: null,
    });
  });
});

describe("Brapi quote fetchers", () => {
  it("returns 404 when the provider has no results", async () => {
    const gateway = new BrapiMarketDataGateway(
      "token",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: [] }), { status: 200 }),
        ),
    );

    await expect(
      gateway.fetchQuote({ assetType: "stock", symbol: "PETR4" }),
    ).rejects.toMatchObject({
      status: 404,
      code: "ASSET_NOT_FOUND",
    });
  });

  it("returns 502 when the provider times out", async () => {
    const gateway = new BrapiMarketDataGateway(
      "token",
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new DOMException("Timed out", "AbortError")),
    );

    await expect(
      gateway.fetchQuote({ assetType: "stock", symbol: "PETR4" }),
    ).rejects.toMatchObject({
      status: 502,
      code: "EXTERNAL_SERVICE_ERROR",
    });
  });

  it("fetches stock quotes from the quote endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: "BTC",
              longName: "Bitcoin",
              currency: "USD",
              regularMarketPrice: 30.99,
              regularMarketTime: "2026-03-11T00:38:08.000Z",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const gateway = new BrapiMarketDataGateway("token", fetchMock);

    await expect(
      gateway.fetchQuote({ assetType: "stock", symbol: "PETR4" }),
    ).resolves.toEqual({
      ticker: "PETR4",
      name: "Bitcoin",
      market: "B3",
      currency: "USD",
      price: 30.99,
      change: 0,
      changePercent: 0,
      quotedAt: "2026-03-11T00:38:08.000Z",
      logoUrl: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://brapi.dev/api/quote/PETR4",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token",
        }),
      }),
    );
  });
});
