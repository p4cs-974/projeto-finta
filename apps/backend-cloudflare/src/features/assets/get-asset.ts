import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import {
	buildAssetQuoteCacheKey,
	buildAssetQuoteLockKey,
	validateAssetTicker,
} from "../../lib/assets";
import { json } from "../../lib/http";

import { fetchBrapiAssetQuote } from "./brapi-gateway";
import type {
	AssetQuote,
	AssetQuoteCacheEntry,
	AssetQuoteWithCacheResponse,
} from "./types";

const ASSET_CACHE_TTL_MS = 5 * 60 * 1000;
const ASSET_LOCK_TTL_SECONDS = 30;

interface GetAssetDependencies {
	now?: () => Date;
	fetchQuote?: typeof fetchBrapiAssetQuote;
}

export function isAssetQuoteCacheStale(
	entry: AssetQuoteCacheEntry,
	now: Date = new Date(),
): boolean {
	return Date.parse(entry.updatedAt) + ASSET_CACHE_TTL_MS <= now.getTime();
}

function buildAssetResponse(
	entry: AssetQuoteCacheEntry,
	cacheKey: string,
	stale: boolean,
	source: "cache" | "live",
): AssetQuoteWithCacheResponse {
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

async function writeAssetCache(env: AppEnv, cacheKey: string, entry: AssetQuoteCacheEntry): Promise<void> {
	await env.ASSET_CACHE.put(cacheKey, JSON.stringify(entry));
}

async function refreshAssetCache(
	env: AppEnv,
	ticker: string,
	now: Date,
	fetchQuote: typeof fetchBrapiAssetQuote,
): Promise<AssetQuoteCacheEntry> {
	const data = await fetchQuote(ticker, env.BRAPI_TOKEN);
	const entry: AssetQuoteCacheEntry = {
		ticker,
		updatedAt: now.toISOString(),
		data,
	};

	await writeAssetCache(env, buildAssetQuoteCacheKey(ticker), entry);
	return entry;
}

async function acquireRefreshLock(env: AppEnv, lockKey: string): Promise<boolean> {
	const existingLock = await env.ASSET_CACHE.get(lockKey);

	if (existingLock) {
		return false;
	}

	await env.ASSET_CACHE.put(lockKey, "1", {
		expirationTtl: ASSET_LOCK_TTL_SECONDS,
	});

	return true;
}

async function refreshAssetCacheInBackground(
	env: AppEnv,
	ticker: string,
	now: Date,
	fetchQuote: typeof fetchBrapiAssetQuote,
): Promise<void> {
	const lockKey = buildAssetQuoteLockKey(ticker);
	const lockAcquired = await acquireRefreshLock(env, lockKey);

	if (!lockAcquired) {
		return;
	}

	try {
		await refreshAssetCache(env, ticker, now, fetchQuote);
	} catch (error) {
		console.error("Failed to refresh asset quote cache", { ticker, error });
	} finally {
		await env.ASSET_CACHE.delete(lockKey);
	}
}

export async function handleGetAsset(
	request: Request,
	env: AppEnv,
	ctx: ExecutionContext,
	rawTicker: string,
	dependencies: GetAssetDependencies = {},
): Promise<Response> {
	await requireAuth(request, env.JWT_SECRET);

	const ticker = validateAssetTicker(rawTicker);
	const cacheKey = buildAssetQuoteCacheKey(ticker);
	const cachedEntry = await env.ASSET_CACHE.get<AssetQuoteCacheEntry>(cacheKey, "json");
	const now = dependencies.now?.() ?? new Date();
	const fetchQuote = dependencies.fetchQuote ?? fetchBrapiAssetQuote;

	if (!cachedEntry) {
		const entry = await refreshAssetCache(env, ticker, now, fetchQuote);
		return json(buildAssetResponse(entry, cacheKey, false, "live"));
	}

	const stale = isAssetQuoteCacheStale(cachedEntry, now);

	if (stale) {
		ctx.waitUntil(refreshAssetCacheInBackground(env, ticker, now, fetchQuote));
	}

	return json(buildAssetResponse(cachedEntry, cacheKey, stale, "cache"));
}

export const assetQuoteCacheTtlMs = ASSET_CACHE_TTL_MS;
export type { AssetQuote };
