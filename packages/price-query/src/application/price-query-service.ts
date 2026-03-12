import type {
  IPriceQueryService,
  QuoteRequest,
  QuoteSearchRequest,
} from "../contracts/quotes";
import type { IMarketDataGateway, IQuoteSnapshotStore } from "../ports";

import {
  buildQuoteCacheEntry,
  buildQuoteWithCacheMeta,
  DEFAULT_QUOTE_CACHE_TTL_MS,
  DEFAULT_QUOTE_REFRESH_LOCK_TTL_SECONDS,
  isQuoteCacheStale,
} from "./cache-policy";

export interface PriceQueryServiceOptions {
  marketDataGateway: IMarketDataGateway;
  quoteSnapshotStore: IQuoteSnapshotStore;
  now?: () => Date;
  cacheTtlMs?: number;
  refreshLockTtlSeconds?: number;
  scheduleTask?: (task: Promise<void>) => void;
  onRefreshError?: (error: unknown, input: QuoteRequest) => void;
}

export class PriceQueryService implements IPriceQueryService {
  private readonly now: () => Date;
  private readonly cacheTtlMs: number;
  private readonly refreshLockTtlSeconds: number;

  constructor(private readonly options: PriceQueryServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_QUOTE_CACHE_TTL_MS;
    this.refreshLockTtlSeconds =
      options.refreshLockTtlSeconds ?? DEFAULT_QUOTE_REFRESH_LOCK_TTL_SECONDS;
  }

  async getLiveQuote(input: QuoteRequest) {
    const cachedEntry = await this.options.quoteSnapshotStore.get(input);

    if (!cachedEntry) {
      return this.refreshQuote(input);
    }

    const stale = isQuoteCacheStale(cachedEntry, this.now(), this.cacheTtlMs);

    if (stale) {
      this.scheduleBackgroundRefresh(input);
    }

    return buildQuoteWithCacheMeta(cachedEntry, stale, "cache");
  }

  async getCachedQuote(input: QuoteRequest) {
    const cachedEntry = await this.options.quoteSnapshotStore.get(input);

    if (!cachedEntry) {
      return null;
    }

    return buildQuoteWithCacheMeta(
      cachedEntry,
      isQuoteCacheStale(cachedEntry, this.now(), this.cacheTtlMs),
      "cache",
    );
  }

  async searchCachedQuotes(input: QuoteSearchRequest) {
    const entries = await this.options.quoteSnapshotStore.listByPrefix(input);

    return [...entries]
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
      )
      .slice(0, input.limit)
      .map((entry) =>
        buildQuoteWithCacheMeta(
          entry,
          isQuoteCacheStale(entry, this.now(), this.cacheTtlMs),
          "cache",
        ),
      );
  }

  private scheduleBackgroundRefresh(input: QuoteRequest) {
    const task = this.refreshQuoteInBackground(input).catch((error) => {
      this.options.onRefreshError?.(error, input);
    });

    if (this.options.scheduleTask) {
      this.options.scheduleTask(task);
      return;
    }

    void task;
  }

  private async refreshQuote(input: QuoteRequest) {
    const quote = await this.options.marketDataGateway.fetchQuote(input);
    const entry = buildQuoteCacheEntry(input, quote, this.now().toISOString());

    await this.options.quoteSnapshotStore.put(entry);
    return buildQuoteWithCacheMeta(entry, false, "live");
  }

  private async refreshQuoteInBackground(input: QuoteRequest) {
    const lockAcquired =
      await this.options.quoteSnapshotStore.acquireRefreshLock(
        input,
        this.refreshLockTtlSeconds,
      );

    if (!lockAcquired) {
      return;
    }

    try {
      await this.refreshQuote(input);
    } finally {
      await this.options.quoteSnapshotStore.releaseRefreshLock(input);
    }
  }
}
