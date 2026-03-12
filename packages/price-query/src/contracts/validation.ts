import { createApplicationError, type AssetType } from "@finta/shared-kernel";

const STOCK_SYMBOL_PATTERN = /^[A-Z]{4}[0-9]{1,2}(?:\.[A-Z]{2,5})?$/u;
const STOCK_SEARCH_QUERY_PATTERN =
  /^[A-Z]{1,4}(?:[0-9]{0,2}(?:\.[A-Z]{0,5})?)?$/u;
const CRYPTO_SYMBOL_PATTERN = /^[A-Z0-9.-]{2,15}$/u;
const CRYPTO_SEARCH_QUERY_PATTERN = /^[A-Z0-9.-]{1,15}$/u;

export function normalizeQuoteInput(value: string) {
  return value.trim().toUpperCase();
}

export function isValidQuoteSymbol(assetType: AssetType, value: string) {
  const normalized = normalizeQuoteInput(value);

  return assetType === "stock"
    ? STOCK_SYMBOL_PATTERN.test(normalized)
    : CRYPTO_SYMBOL_PATTERN.test(normalized);
}

export function validateQuoteSymbol(assetType: AssetType, value: string) {
  const normalized = normalizeQuoteInput(value);

  if (isValidQuoteSymbol(assetType, normalized)) {
    return normalized;
  }

  throw createApplicationError(
    422,
    "VALIDATION_ERROR",
    assetType === "stock"
      ? "Invalid asset ticker"
      : "Invalid crypto asset symbol",
  );
}

export function validateQuoteSearchQuery(assetType: AssetType, value: string) {
  const normalized = normalizeQuoteInput(value);
  const isValid =
    assetType === "stock"
      ? STOCK_SEARCH_QUERY_PATTERN.test(normalized)
      : CRYPTO_SEARCH_QUERY_PATTERN.test(normalized);

  if (isValid) {
    return normalized;
  }

  throw createApplicationError(
    422,
    "VALIDATION_ERROR",
    assetType === "stock"
      ? "Invalid asset ticker prefix"
      : "Invalid crypto asset symbol prefix",
  );
}

export function normalizeQuoteSearchLimit(value: number, fallback = 5) {
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return Math.min(value, 50);
}
