import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import {
	buildCryptoQuoteCacheKey,
	buildCryptoQuoteLockKey,
	validateAssetType,
	validateCryptoAssetSymbol,
} from "../../lib/assets";
import { json } from "../../lib/http";

import { fetchBrapiCryptoQuote } from "./brapi-gateway";
import type {
	CryptoAssetCacheEntry,
	CryptoAssetQuote,
	CryptoAssetQuoteResponse,
} from "./types";

const CRYPTO_CACHE_TTL_MS = 5 * 60 * 1000;
const CRYPTO_LOCK_TTL_SECONDS = 30;

interface GetCryptoAssetDependencies {
	now?: () => Date;
	fetchQuote?: typeof fetchBrapiCryptoQuote;
}

export function isCryptoAssetCacheStale(
	entry: CryptoAssetCacheEntry,
	now: Date = new Date(),
): boolean {
	return Date.parse(entry.updatedAt) + CRYPTO_CACHE_TTL_MS <= now.getTime();
}

function buildCryptoAssetResponse(
	entry: CryptoAssetCacheEntry,
	cacheKey: string,
	stale: boolean,
	source: "cache" | "live",
): CryptoAssetQuoteResponse {
	return {
		data: entry.data,
		cache: {
			key: cacheKey,
			updatedAt: entry.updatedAt,
			stale,
			source,
		},
	};
}

async function writeCryptoCache(
	env: AppEnv,
	cacheKey: string,
	entry: CryptoAssetCacheEntry,
): Promise<void> {
	await env.ASSET_CACHE.put(cacheKey, JSON.stringify(entry));
}

async function refreshCryptoCache(
	env: AppEnv,
	symbol: string,
	now: Date,
	fetchQuote: typeof fetchBrapiCryptoQuote,
): Promise<CryptoAssetCacheEntry> {
	const data = await fetchQuote(symbol, env.BRAPI_TOKEN);
	const entry: CryptoAssetCacheEntry = {
		symbol,
		updatedAt: now.toISOString(),
		data,
	};

	await writeCryptoCache(env, buildCryptoQuoteCacheKey(symbol), entry);
	return entry;
}

async function acquireRefreshLock(env: AppEnv, lockKey: string): Promise<boolean> {
	const existingLock = await env.ASSET_CACHE.get(lockKey);

	if (existingLock) {
		return false;
	}

	await env.ASSET_CACHE.put(lockKey, "1", {
		expirationTtl: CRYPTO_LOCK_TTL_SECONDS,
	});

	return true;
}

async function refreshCryptoCacheInBackground(
	env: AppEnv,
	symbol: string,
	now: Date,
	fetchQuote: typeof fetchBrapiCryptoQuote,
): Promise<void> {
	const lockKey = buildCryptoQuoteLockKey(symbol);
	const lockAcquired = await acquireRefreshLock(env, lockKey);

	if (!lockAcquired) {
		return;
	}

	try {
		await refreshCryptoCache(env, symbol, now, fetchQuote);
	} catch (error) {
		console.error("Failed to refresh crypto quote cache", { symbol, error });
	} finally {
		await env.ASSET_CACHE.delete(lockKey);
	}
}

export async function handleGetCryptoAsset(
	request: Request,
	env: AppEnv,
	ctx: ExecutionContext,
	rawSymbol: string,
	dependencies: GetCryptoAssetDependencies = {},
): Promise<Response> {
	await requireAuth(request, env.JWT_SECRET);

	const url = new URL(request.url);
	validateAssetType(url.searchParams.get("type"));

	const symbol = validateCryptoAssetSymbol(rawSymbol);
	const cacheKey = buildCryptoQuoteCacheKey(symbol);
	const cachedEntry = await env.ASSET_CACHE.get<CryptoAssetCacheEntry>(cacheKey, "json");
	const now = dependencies.now?.() ?? new Date();
	const fetchQuote = dependencies.fetchQuote ?? fetchBrapiCryptoQuote;

	if (!cachedEntry) {
		const entry = await refreshCryptoCache(env, symbol, now, fetchQuote);
		return json(buildCryptoAssetResponse(entry, cacheKey, false, "live"));
	}

	const stale = isCryptoAssetCacheStale(cachedEntry, now);

	if (stale) {
		ctx.waitUntil(refreshCryptoCacheInBackground(env, symbol, now, fetchQuote));
	}

	return json(buildCryptoAssetResponse(cachedEntry, cacheKey, stale, "cache"));
}

export const cryptoAssetCacheTtlMs = CRYPTO_CACHE_TTL_MS;
export type { CryptoAssetQuote };
