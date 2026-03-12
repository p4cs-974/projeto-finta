import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import {
	buildAssetQuoteCacheKeyPrefix,
	buildCryptoQuoteCacheKeyPrefix,
	normalizeAssetSearchPrefix,
	normalizeCryptoAssetSearchPrefix,
	validateAssetType,
} from "../../lib/assets";
import { json } from "../../lib/http";

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

type CachedMatch = AssetQuoteWithCacheResponse | CryptoAssetQuoteResponse;

async function loadCachedMatches<TEntry, TResult extends CachedMatch>(
	env: AppEnv,
	prefix: string,
	toResponse: (entry: TEntry, key: string) => TResult,
): Promise<TResult[]> {
	const listing = await env.ASSET_CACHE.list({
		prefix,
		limit: 5,
	});
	const entries = await Promise.all(
		listing.keys.map(async ({ name }) => {
			const value = await env.ASSET_CACHE.get<TEntry>(name, "json");
			return value ? toResponse(value, name) : null;
		}),
	);

	const matches: TResult[] = [];

	for (const entry of entries) {
		if (entry) {
			matches.push(entry);
		}
	}

	return matches.sort(
		(left, right) =>
			Date.parse(right.cache.updatedAt) - Date.parse(left.cache.updatedAt),
	);
}

export async function handleSearchCachedAssets(
	request: Request,
	env: AppEnv,
): Promise<Response> {
	await requireAuth(request, env.JWT_SECRET);

	const url = new URL(request.url);
	const rawQuery = url.searchParams.get("q") ?? "";

	if (validateAssetType(url.searchParams.get("type")) === "crypto") {
		const prefix = buildCryptoQuoteCacheKeyPrefix(
			normalizeCryptoAssetSearchPrefix(rawQuery),
		);
		const data = await loadCachedMatches<
			CryptoAssetCacheEntry,
			CryptoAssetQuoteResponse
		>(env, prefix, (entry, key) =>
			buildCryptoAssetResponse(
				entry,
				key,
				isCryptoAssetCacheStale(entry),
				"cache",
			),
		);

		return json({ data });
	}

	const prefix = buildAssetQuoteCacheKeyPrefix(normalizeAssetSearchPrefix(rawQuery));
	const data = await loadCachedMatches<
		AssetQuoteCacheEntry,
		AssetQuoteWithCacheResponse
	>(env, prefix, (entry, key) =>
		buildAssetResponse(entry, key, isAssetQuoteCacheStale(entry), "cache"),
	);

	return json({ data });
}
