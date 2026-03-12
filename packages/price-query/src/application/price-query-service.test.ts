import { describe, expect, it, vi } from "vitest";

import type {
  PriceQuote,
  QuoteCacheEntry,
  QuoteRequest,
  QuoteSearchRequest,
} from "../contracts/quotes";
import type { IMarketDataGateway, IQuoteSnapshotStore } from "../ports";

import {
  buildQuoteCacheEntry,
  buildQuoteCacheKey,
  buildQuoteRefreshLockKey,
} from "./cache-policy";
import { PriceQueryService } from "./price-query-service";

class InMemoryQuoteSnapshotStore implements IQuoteSnapshotStore {
  readonly entries = new Map<string, QuoteCacheEntry>();
  readonly locks = new Set<string>();

  async get(input: QuoteRequest) {
    return this.entries.get(buildQuoteCacheKey(input)) ?? null;
  }

  async put(entry: QuoteCacheEntry) {
    this.entries.set(entry.key, entry);
  }

  async listByPrefix(input: QuoteSearchRequest) {
    const prefix = buildQuoteCacheKey({
      assetType: input.assetType,
      symbol: input.query,
    });

    return [...this.entries.values()].filter((entry) =>
      entry.key.startsWith(prefix),
    );
  }

  async acquireRefreshLock(input: QuoteRequest) {
    const key = buildQuoteRefreshLockKey(input);

    if (this.locks.has(key)) {
      return false;
    }

    this.locks.add(key);
    return true;
  }

  async releaseRefreshLock(input: QuoteRequest) {
    this.locks.delete(buildQuoteRefreshLockKey(input));
  }
}

function createStockQuote(ticker: string, price = 38.42): PriceQuote {
  return {
    ticker,
    name: `Asset ${ticker}`,
    market: "B3",
    currency: "BRL",
    price,
    change: 0,
    changePercent: 0,
    quotedAt: "2026-03-11T12:00:00.000Z",
    logoUrl: null,
  };
}

describe("PriceQueryService", () => {
  it("returns a live quote on cold cache", async () => {
    const quoteSnapshotStore = new InMemoryQuoteSnapshotStore();
    const marketDataGateway: IMarketDataGateway = {
      fetchQuote: vi.fn().mockResolvedValue(createStockQuote("PETR4")),
    };
    const service = new PriceQueryService({
      marketDataGateway,
      quoteSnapshotStore,
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    });

    const response = await service.getLiveQuote({
      assetType: "stock",
      symbol: "PETR4",
    });

    expect(response.cache.source).toBe("live");
    expect(response.cache.stale).toBe(false);
    expect(response.cache.key).toBe("asset-quote:v1:PETR4");
    expect(marketDataGateway.fetchQuote).toHaveBeenCalledTimes(1);
    expect(quoteSnapshotStore.entries.get("asset-quote:v1:PETR4")).toBeTruthy();
  });

  it("returns a cached quote on warm cache", async () => {
    const quoteSnapshotStore = new InMemoryQuoteSnapshotStore();
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "stock", symbol: "PETR4" },
        createStockQuote("PETR4"),
        "2026-03-11T12:00:00.000Z",
      ),
    );
    const marketDataGateway: IMarketDataGateway = {
      fetchQuote: vi.fn(),
    };
    const service = new PriceQueryService({
      marketDataGateway,
      quoteSnapshotStore,
      now: () => new Date("2026-03-11T12:04:00.000Z"),
    });

    const response = await service.getLiveQuote({
      assetType: "stock",
      symbol: "PETR4",
    });

    expect(response.cache.source).toBe("cache");
    expect(response.cache.stale).toBe(false);
    expect(marketDataGateway.fetchQuote).not.toHaveBeenCalled();
  });

  it("marks cached quotes as stale once ttl expires", async () => {
    const quoteSnapshotStore = new InMemoryQuoteSnapshotStore();
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "stock", symbol: "PETR4" },
        createStockQuote("PETR4"),
        "2026-03-11T12:00:00.000Z",
      ),
    );
    const service = new PriceQueryService({
      marketDataGateway: {
        fetchQuote: vi.fn().mockResolvedValue(createStockQuote("PETR4", 41)),
      },
      quoteSnapshotStore,
      now: () => new Date("2026-03-11T12:05:00.000Z"),
      scheduleTask: vi.fn(),
    });

    const response = await service.getLiveQuote({
      assetType: "stock",
      symbol: "PETR4",
    });

    expect(response.cache.source).toBe("cache");
    expect(response.cache.stale).toBe(true);
  });

  it("refreshes stale quotes in the background", async () => {
    const quoteSnapshotStore = new InMemoryQuoteSnapshotStore();
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "stock", symbol: "PETR4" },
        createStockQuote("PETR4", 38.42),
        "2026-03-11T12:00:00.000Z",
      ),
    );
    const scheduledTasks: Promise<void>[] = [];
    const service = new PriceQueryService({
      marketDataGateway: {
        fetchQuote: vi.fn().mockResolvedValue(createStockQuote("PETR4", 39.12)),
      },
      quoteSnapshotStore,
      now: () => new Date("2026-03-11T12:06:00.000Z"),
      scheduleTask(task) {
        scheduledTasks.push(task);
      },
    });

    const response = await service.getLiveQuote({
      assetType: "stock",
      symbol: "PETR4",
    });
    await Promise.all(scheduledTasks);

    expect(response.cache.stale).toBe(true);
    expect(
      quoteSnapshotStore.entries.get("asset-quote:v1:PETR4")?.data,
    ).toMatchObject({
      price: 39.12,
    });
  });

  it("returns null when cached quote is missing", async () => {
    const service = new PriceQueryService({
      marketDataGateway: {
        fetchQuote: vi.fn(),
      },
      quoteSnapshotStore: new InMemoryQuoteSnapshotStore(),
    });

    await expect(
      service.getCachedQuote({ assetType: "crypto", symbol: "BTC" }),
    ).resolves.toBeNull();
  });

  it("searches cached quotes by asset type and limit", async () => {
    const quoteSnapshotStore = new InMemoryQuoteSnapshotStore();
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "stock", symbol: "PETR4" },
        createStockQuote("PETR4"),
        "2026-03-11T12:05:00.000Z",
      ),
    );
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "stock", symbol: "PETR3" },
        createStockQuote("PETR3"),
        "2026-03-11T12:04:00.000Z",
      ),
    );
    await quoteSnapshotStore.put(
      buildQuoteCacheEntry(
        { assetType: "crypto", symbol: "BTC" },
        {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 88000,
          change: 0,
          changePercent: 0,
          quotedAt: "2026-03-11T12:05:00.000Z",
        },
        "2026-03-11T12:03:00.000Z",
      ),
    );

    const service = new PriceQueryService({
      marketDataGateway: {
        fetchQuote: vi.fn(),
      },
      quoteSnapshotStore,
      now: () => new Date("2026-03-11T12:05:30.000Z"),
    });

    const results = await service.searchCachedQuotes({
      assetType: "stock",
      query: "PETR",
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.cache.key).toBe("asset-quote:v1:PETR4");
  });
});
