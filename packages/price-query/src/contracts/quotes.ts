import type { AssetType } from "@finta/shared-kernel";

export interface QuoteRequest {
  assetType: AssetType;
  symbol: string;
}

export interface QuoteSearchRequest {
  assetType: AssetType;
  query: string;
  limit: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  market: "B3";
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  quotedAt: string;
  logoUrl: string | null;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  quotedAt: string;
}

export type PriceQuote = StockQuote | CryptoQuote;

export interface QuoteWithCacheMeta {
  data: PriceQuote;
  cache: {
    key: string;
    updatedAt: string;
    stale: boolean;
    source: "cache" | "live";
  };
}

export interface QuoteCacheEntry {
  request: QuoteRequest;
  key: string;
  updatedAt: string;
  data: PriceQuote;
  ticker?: string;
  symbol?: string;
}

export interface CachedQuoteSearchResponse {
  data: QuoteWithCacheMeta[];
}

export interface IPriceQueryService {
  getLiveQuote(input: QuoteRequest): Promise<QuoteWithCacheMeta>;
  getCachedQuote(input: QuoteRequest): Promise<QuoteWithCacheMeta | null>;
  searchCachedQuotes(input: QuoteSearchRequest): Promise<QuoteWithCacheMeta[]>;
}

export function isStockQuote(quote: PriceQuote): quote is StockQuote {
  return "ticker" in quote;
}

export function isStockQuoteWithCache(
  quote: QuoteWithCacheMeta,
): quote is QuoteWithCacheMeta & { data: StockQuote } {
  return isStockQuote(quote.data);
}

function unwrapQuoteData(quote: PriceQuote | QuoteWithCacheMeta): PriceQuote {
  return "data" in quote ? quote.data : quote;
}

export function getQuoteSymbol(quote: PriceQuote | QuoteWithCacheMeta) {
  const data = unwrapQuoteData(quote);
  return isStockQuote(data) ? data.ticker : data.symbol;
}

export function getQuoteLabel(quote: PriceQuote | QuoteWithCacheMeta) {
  return unwrapQuoteData(quote).name;
}

export function getQuoteLogoUrl(quote: PriceQuote | QuoteWithCacheMeta) {
  const data = unwrapQuoteData(quote);
  return isStockQuote(data) ? data.logoUrl : null;
}
