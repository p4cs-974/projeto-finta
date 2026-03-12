import {
  getQuoteLabel,
  getQuoteLogoUrl,
  getQuoteSymbol,
  isStockQuoteWithCache,
  isValidQuoteSymbol,
  normalizeQuoteInput,
  type QuoteWithCacheMeta,
} from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";

export type SearchMode = "stocks" | "crypto";

export function normalizeSearchInput(value: string) {
  return normalizeQuoteInput(value);
}

export function isValidSearchInput(value: string, mode: SearchMode) {
  return isValidQuoteSymbol(getModeAssetType(mode), value);
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

export function getRecentMode(assetType: AssetType): SearchMode {
  return assetType === "crypto" ? "crypto" : "stocks";
}

export function getModeAssetType(mode: SearchMode): AssetType {
  return mode === "crypto" ? "crypto" : "stock";
}

export {
  getQuoteLabel,
  getQuoteLogoUrl,
  getQuoteSymbol,
  isStockQuoteWithCache,
};
export type { QuoteWithCacheMeta };
