import { apiError } from "./http";

const ASSET_TICKER_PATTERN = /^[A-Z]{4}[0-9]{1,2}$/u;
const CRYPTO_ASSET_SYMBOL_PATTERN = /^[A-Z0-9.-]{2,15}$/u;
const ASSET_CACHE_PREFIX = "asset-quote:v1:";
const ASSET_LOCK_PREFIX = "asset-quote-lock:v1:";
const CRYPTO_CACHE_PREFIX = "crypto-quote:v1:";
const CRYPTO_LOCK_PREFIX = "crypto-quote-lock:v1:";

export function validateAssetTicker(input: string): string {
	const normalizedTicker = input.trim().toUpperCase();

	if (!ASSET_TICKER_PATTERN.test(normalizedTicker)) {
		throw apiError(422, "VALIDATION_ERROR", "Invalid asset ticker");
	}

	return normalizedTicker;
}

export function normalizeCryptoAssetSymbol(input: string): string {
	return input.trim().toUpperCase();
}

export function validateCryptoAssetSymbol(input: string): string {
	const normalizedSymbol = normalizeCryptoAssetSymbol(input);

	if (!CRYPTO_ASSET_SYMBOL_PATTERN.test(normalizedSymbol)) {
		throw apiError(422, "VALIDATION_ERROR", "Invalid crypto asset symbol");
	}

	return normalizedSymbol;
}

export function validateAssetType(input: string | null): "crypto" | null {
	if (input === null) {
		return null;
	}

	if (input !== "crypto") {
		throw apiError(422, "VALIDATION_ERROR", "Invalid asset type");
	}

	return "crypto";
}

export function buildAssetQuoteCacheKey(ticker: string): string {
	return `${ASSET_CACHE_PREFIX}${ticker}`;
}

export function buildAssetQuoteLockKey(ticker: string): string {
	return `${ASSET_LOCK_PREFIX}${ticker}`;
}

export function buildCryptoQuoteCacheKey(symbol: string): string {
	return `${CRYPTO_CACHE_PREFIX}${symbol}`;
}

export function buildCryptoQuoteLockKey(symbol: string): string {
	return `${CRYPTO_LOCK_PREFIX}${symbol}`;
}
