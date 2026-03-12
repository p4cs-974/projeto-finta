import type {
  PriceQuote,
  QuoteCacheEntry,
  QuoteRequest,
  QuoteSearchRequest,
} from "../contracts/quotes";

export interface IMarketDataGateway {
  fetchQuote(input: QuoteRequest): Promise<PriceQuote>;
}

export interface IQuoteSnapshotStore {
  get(input: QuoteRequest): Promise<QuoteCacheEntry | null>;
  put(entry: QuoteCacheEntry): Promise<void>;
  listByPrefix(input: QuoteSearchRequest): Promise<QuoteCacheEntry[]>;
  acquireRefreshLock(input: QuoteRequest, ttlSeconds: number): Promise<boolean>;
  releaseRefreshLock(input: QuoteRequest): Promise<void>;
}
