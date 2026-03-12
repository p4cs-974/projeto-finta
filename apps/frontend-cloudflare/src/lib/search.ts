export type SearchMode = "stocks" | "crypto";
export type AssetType = "stock" | "crypto";

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

export interface QuoteCacheMeta {
  key: string;
  updatedAt: string;
  stale: boolean;
  source: "cache" | "live";
}

export interface StockQuoteResponse {
  data: StockQuote;
  cache: QuoteCacheMeta;
}

export interface CryptoQuoteResponse {
  data: CryptoQuote;
  cache: QuoteCacheMeta;
}

export type QuoteResponse = StockQuoteResponse | CryptoQuoteResponse;

export interface RecentAssetSelection {
  symbol: string;
  type: AssetType;
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  lastSelectedAt: string;
}

const STOCK_PATTERN = /^[A-Z]{4}[0-9]{1,2}(?:\.[A-Z]{2,5})?$/u;
const CRYPTO_PATTERN = /^[A-Z0-9.-]{2,15}$/u;

export function normalizeSearchInput(value: string) {
  return value.trim().toUpperCase();
}

export function isValidSearchInput(value: string, mode: SearchMode) {
  const normalized = normalizeSearchInput(value);
  return mode === "stocks"
    ? STOCK_PATTERN.test(normalized)
    : CRYPTO_PATTERN.test(normalized);
}

export function formatMoney(currency: string, value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (Math.abs(diffMinutes) < 1) {
    return "agora";
  }

  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMs / 3_600_000);

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffMs / 86_400_000);
  return rtf.format(diffDays, "day");
}

export function isStockQuoteResponse(
  quote: QuoteResponse,
): quote is StockQuoteResponse {
  return "ticker" in quote.data;
}

export function getQuoteSymbol(quote: QuoteResponse) {
  return isStockQuoteResponse(quote) ? quote.data.ticker : quote.data.symbol;
}

export function getQuoteLabel(quote: QuoteResponse) {
  return quote.data.name;
}

export function getQuoteLogoUrl(quote: QuoteResponse) {
  return isStockQuoteResponse(quote) ? quote.data.logoUrl : null;
}

export function getRecentMode(type: AssetType): SearchMode {
  return type === "crypto" ? "crypto" : "stocks";
}

export function getModeAssetType(mode: SearchMode): AssetType {
  return mode === "crypto" ? "crypto" : "stock";
}
