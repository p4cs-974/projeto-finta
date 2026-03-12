import { describe, expect, it, vi } from "vitest";

import {
  adaptCoinCapCryptoQuote,
  CoinCapMarketDataGateway,
  derivePriceChange,
} from "./coincap-market-data-gateway";

describe("CoinCap crypto adapter", () => {
  it("maps provider payloads to the crypto contract", () => {
    expect(
      adaptCoinCapCryptoQuote(
        {
          name: "Bitcoin",
          priceUsd: "88432.15",
          changePercent24Hr: "1.43",
        },
        "btc",
        "2026-03-12T00:00:00.000Z",
      ),
    ).toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      currency: "USD",
      price: 88432.15,
      changePercent: 1.43,
      change: derivePriceChange(88432.15, 1.43),
      quotedAt: "2026-03-12T00:00:00.000Z",
    });
  });

  it("falls back to zero when the derived change is non-finite", () => {
    expect(derivePriceChange(10, -100)).toBe(0);
  });
});

describe("CoinCap quote fetcher", () => {
  it("searches by symbol and then fetches the asset detail", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
              {
                id: "wrapped-bitcoin",
                symbol: "WBTC",
                name: "Wrapped Bitcoin",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              id: "bitcoin",
              symbol: "BTC",
              name: "Bitcoin",
              priceUsd: "88432.15",
              changePercent24Hr: "1.43",
            },
          }),
          { status: 200 },
        ),
      );
    const gateway = new CoinCapMarketDataGateway(
      "coincap-token",
      fetchMock,
      () => new Date("2026-03-12T00:00:00.000Z"),
    );

    await expect(
      gateway.fetchQuote({ assetType: "crypto", symbol: "btc" }),
    ).resolves.toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      currency: "USD",
      price: 88432.15,
      changePercent: 1.43,
      change: derivePriceChange(88432.15, 1.43),
      quotedAt: "2026-03-12T00:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://rest.coincap.io/v3/assets?search=BTC",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer coincap-token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://rest.coincap.io/v3/assets/bitcoin",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer coincap-token",
        }),
      }),
    );
  });

  it("returns 404 when there is no exact symbol match", async () => {
    const gateway = new CoinCapMarketDataGateway(
      "token",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "wrapped-bitcoin",
                symbol: "WBTC",
                name: "Wrapped Bitcoin",
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      gateway.fetchQuote({ assetType: "crypto", symbol: "BTC" }),
    ).rejects.toMatchObject({
      status: 404,
      code: "ASSET_NOT_FOUND",
    });
  });

  it("returns 502 on malformed payloads", async () => {
    const gateway = new CoinCapMarketDataGateway(
      "token",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: [{ id: "bitcoin", symbol: "BTC", name: "Bitcoin" }],
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: {
                id: "bitcoin",
                symbol: "BTC",
                name: "Bitcoin",
                priceUsd: "not-a-number",
                changePercent24Hr: "1.43",
              },
            }),
            { status: 200 },
          ),
        ),
    );

    await expect(
      gateway.fetchQuote({ assetType: "crypto", symbol: "BTC" }),
    ).rejects.toMatchObject({
      status: 502,
      code: "EXTERNAL_SERVICE_ERROR",
    });
  });

  it("returns 502 when the provider times out", async () => {
    const gateway = new CoinCapMarketDataGateway(
      "token",
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new DOMException("Timed out", "AbortError")),
    );

    await expect(
      gateway.fetchQuote({ assetType: "crypto", symbol: "BTC" }),
    ).rejects.toMatchObject({
      status: 502,
      code: "EXTERNAL_SERVICE_ERROR",
    });
  });
});
