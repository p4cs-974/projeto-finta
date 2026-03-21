import type {
  DashboardMarketAsset,
  DashboardMarketMovers,
  IDashboardMarketMoversProvider,
} from "@finta/dashboard";
import type { QuoteCacheEntry } from "@finta/price-query";
import {
  buildQuoteCacheKeyPrefix,
  buildQuoteWithCacheMeta,
  isQuoteCacheStale,
} from "@finta/price-query";

const KV_LIST_PAGE_SIZE = 1000;
const KV_READ_BATCH_SIZE = 100;
const MARKET_MOVER_LIMIT = 4;

type BulkJsonKvNamespace = KVNamespace & {
  get(
    keys: string[],
    type: "json",
  ): Promise<Map<string, unknown>>;
};

function isQuoteCacheEntry(value: unknown): value is QuoteCacheEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "request" in value &&
    "key" in value &&
    "updatedAt" in value &&
    "data" in value
  );
}

function getAssetKey(asset: DashboardMarketAsset) {
  return `${asset.assetType}:${asset.symbol}`;
}

function compareByChangePercentDescending(
  left: DashboardMarketAsset,
  right: DashboardMarketAsset,
) {
  return right.initialQuote.data.changePercent - left.initialQuote.data.changePercent;
}

function compareByChangePercentAscending(
  left: DashboardMarketAsset,
  right: DashboardMarketAsset,
) {
  return left.initialQuote.data.changePercent - right.initialQuote.data.changePercent;
}

async function listKeysByPrefix(kv: KVNamespace, prefix: string) {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await kv.list({
      prefix,
      limit: KV_LIST_PAGE_SIZE,
      cursor,
    });

    for (const key of result.keys) {
      keys.push(key.name);
    }

    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  return keys;
}

async function getEntriesByKeys(kv: KVNamespace, keys: string[]) {
  const entries: QuoteCacheEntry[] = [];
  const bulkKv = kv as BulkJsonKvNamespace;

  for (let index = 0; index < keys.length; index += KV_READ_BATCH_SIZE) {
    const chunk = keys.slice(index, index + KV_READ_BATCH_SIZE);
    const values = await bulkKv.get(chunk, "json");

    for (const key of chunk) {
      const entry = values.get(key);

      if (isQuoteCacheEntry(entry)) {
        entries.push(entry);
      }
    }
  }

  return entries;
}

function toDashboardMarketAsset(entry: QuoteCacheEntry): DashboardMarketAsset {
  return {
    symbol: entry.request.symbol,
    assetType: entry.request.assetType,
    initialQuote: buildQuoteWithCacheMeta(entry, false, "cache"),
  };
}

export class CloudflareKvDashboardMarketMoversProvider
  implements IDashboardMarketMoversProvider
{
  constructor(private readonly kv: KVNamespace) {}

  async getMarketMovers(now: Date): Promise<DashboardMarketMovers> {
    const prefixes = [
      buildQuoteCacheKeyPrefix({
        assetType: "stock",
        query: "",
        limit: 1,
      }),
      buildQuoteCacheKeyPrefix({
        assetType: "crypto",
        query: "",
        limit: 1,
      }),
    ];
    const [stockKeys, cryptoKeys] = await Promise.all(
      prefixes.map((prefix) => listKeysByPrefix(this.kv, prefix)),
    );
    const entries = await getEntriesByKeys(this.kv, [...stockKeys, ...cryptoKeys]);
    const freshAssets = entries
      .filter((entry) => !isQuoteCacheStale(entry, now))
      .map(toDashboardMarketAsset);
    const gainers = freshAssets
      .filter((asset) => asset.initialQuote.data.changePercent > 0)
      .sort(compareByChangePercentDescending)
      .slice(0, MARKET_MOVER_LIMIT);
    const gainersKeySet = new Set(gainers.map(getAssetKey));
    const losers = freshAssets
      .filter(
        (asset) =>
          asset.initialQuote.data.changePercent < 0 &&
          !gainersKeySet.has(getAssetKey(asset)),
      )
      .sort(compareByChangePercentAscending)
      .slice(0, MARKET_MOVER_LIMIT);

    return {
      gainers,
      losers,
    };
  }
}
