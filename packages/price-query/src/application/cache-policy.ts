import type {
  PriceQuote,
  QuoteCacheEntry,
  QuoteRequest,
  QuoteSearchRequest,
  QuoteWithCacheMeta,
} from "../contracts/quotes";

const STOCK_CACHE_PREFIX = "asset-quote:v1:";
const STOCK_LOCK_PREFIX = "asset-quote-lock:v1:";
const CRYPTO_CACHE_PREFIX = "crypto-quote:v1:";
const CRYPTO_LOCK_PREFIX = "crypto-quote-lock:v1:";

export const DEFAULT_QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_QUOTE_REFRESH_LOCK_TTL_SECONDS = 60;

export function buildQuoteCacheKey(input: QuoteRequest) {
  return input.assetType === "stock"
    ? `${STOCK_CACHE_PREFIX}${input.symbol}`
    : `${CRYPTO_CACHE_PREFIX}${input.symbol}`;
}

export function buildQuoteCacheKeyPrefix(input: QuoteSearchRequest) {
  return input.assetType === "stock"
    ? `${STOCK_CACHE_PREFIX}${input.query}`
    : `${CRYPTO_CACHE_PREFIX}${input.query}`;
}

export function buildQuoteRefreshLockKey(input: QuoteRequest) {
  return input.assetType === "stock"
    ? `${STOCK_LOCK_PREFIX}${input.symbol}`
    : `${CRYPTO_LOCK_PREFIX}${input.symbol}`;
}

export function buildQuoteCacheEntry(
  input: QuoteRequest,
  data: PriceQuote,
  updatedAt: string,
): QuoteCacheEntry {
  const entry: QuoteCacheEntry = {
    request: {
      assetType: input.assetType,
      symbol: input.symbol,
    },
    key: buildQuoteCacheKey(input),
    updatedAt,
    data,
  };

  if (input.assetType === "stock") {
    entry.ticker = input.symbol;
  } else {
    entry.symbol = input.symbol;
  }

  return entry;
}

export function isQuoteCacheStale(
  entry: QuoteCacheEntry,
  now: Date = new Date(),
  ttlMs = DEFAULT_QUOTE_CACHE_TTL_MS,
) {
  return Date.parse(entry.updatedAt) + ttlMs <= now.getTime();
}

export function buildQuoteWithCacheMeta(
  entry: QuoteCacheEntry,
  stale: boolean,
  source: "cache" | "live",
): QuoteWithCacheMeta {
  return {
    data: entry.data,
    cache: {
      key: entry.key,
      updatedAt: entry.updatedAt,
      stale,
      source,
    },
  };
}
