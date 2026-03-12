import type {
  IQuoteSnapshotStore,
  QuoteCacheEntry,
  QuoteRequest,
  QuoteSearchRequest,
} from "@finta/price-query";
import {
  buildQuoteCacheKey,
  buildQuoteCacheKeyPrefix,
  buildQuoteRefreshLockKey,
} from "@finta/price-query";

export class CloudflareKvQuoteSnapshotStore implements IQuoteSnapshotStore {
  constructor(private readonly kv: KVNamespace) {}

  async get(input: QuoteRequest) {
    return (
      (await this.kv.get<QuoteCacheEntry>(buildQuoteCacheKey(input), "json")) ??
      null
    );
  }

  async put(entry: QuoteCacheEntry) {
    await this.kv.put(entry.key, JSON.stringify(entry));
  }

  async listByPrefix(input: QuoteSearchRequest) {
    const listing = await this.kv.list({
      prefix: buildQuoteCacheKeyPrefix(input),
      limit: input.limit,
    });
    const entries = await Promise.all(
      listing.keys.map(async ({ name }) => {
        return (await this.kv.get<QuoteCacheEntry>(name, "json")) ?? null;
      }),
    );

    return entries.filter((entry): entry is QuoteCacheEntry => entry !== null);
  }

  async acquireRefreshLock(input: QuoteRequest, ttlSeconds: number) {
    const lockKey = buildQuoteRefreshLockKey(input);
    const existingLock = await this.kv.get(lockKey);

    if (existingLock) {
      return false;
    }

    await this.kv.put(lockKey, "1", {
      expirationTtl: ttlSeconds,
    });

    return true;
  }

  releaseRefreshLock(input: QuoteRequest) {
    return this.kv.delete(buildQuoteRefreshLockKey(input));
  }
}
