import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import {
	buildAssetQuoteCacheKey,
	buildCryptoQuoteCacheKey,
	validateAssetTicker,
	validateAssetType,
	validateCryptoAssetSymbol,
} from "../../lib/assets";
import { apiError, json } from "../../lib/http";

import { buildAssetResponse, isAssetQuoteCacheStale } from "./get-asset";
import {
	buildCryptoAssetResponse,
	isCryptoAssetCacheStale,
} from "./get-crypto-asset";
import type {
	AssetQuoteCacheEntry,
	AssetQuoteWithCacheResponse,
	CryptoAssetCacheEntry,
	CryptoAssetQuoteResponse,
} from "./types";

export async function handleGetCachedAsset(
	request: Request,
	env: AppEnv,
	rawTicker: string,
): Promise<Response> {
	await requireAuth(request, env.JWT_SECRET);

	const url = new URL(request.url);

	if (validateAssetType(url.searchParams.get("type")) === "crypto") {
		const symbol = validateCryptoAssetSymbol(rawTicker);
		const cacheKey = buildCryptoQuoteCacheKey(symbol);
		const entry = await env.ASSET_CACHE.get<CryptoAssetCacheEntry>(cacheKey, "json");

		if (!entry) {
			throw apiError(404, "ASSET_CACHE_MISS", "Asset quote is not cached");
		}

		const response: CryptoAssetQuoteResponse = buildCryptoAssetResponse(
			entry,
			cacheKey,
			isCryptoAssetCacheStale(entry),
			"cache",
		);

		return json(response);
	}

	const ticker = validateAssetTicker(rawTicker);
	const cacheKey = buildAssetQuoteCacheKey(ticker);
	const entry = await env.ASSET_CACHE.get<AssetQuoteCacheEntry>(cacheKey, "json");

	if (!entry) {
		throw apiError(404, "ASSET_CACHE_MISS", "Asset quote is not cached");
	}

	const response: AssetQuoteWithCacheResponse = buildAssetResponse(
		entry,
		cacheKey,
		isAssetQuoteCacheStale(entry),
		"cache",
	);

	return json(response);
}
