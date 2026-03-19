import "server-only";

import type { FavoriteAsset } from "@finta/favorites";
import type {
  QuoteWithCacheMeta,
  CachedQuoteSearchResponse,
} from "@finta/price-query";
import type { AssetType, ApiErrorBody } from "@finta/shared-kernel";
import type { RecentAssetSelection } from "@finta/user-assets";
import { cache } from "react";
import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  getBackendBaseUrl,
  getSessionFromCookieValue,
} from "@/lib/auth";
import { ApiRequestError } from "@/lib/http-client";

interface RecentAssetSelectionPayload {
  symbol: string;
  type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  lastSelectedAt: string;
}

interface FavoriteAssetPayload {
  symbol: string;
  type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  favoritedAt: string;
}

function toDomainSelection(
  payload: RecentAssetSelectionPayload,
): RecentAssetSelection {
  return {
    symbol: payload.symbol,
    assetType: payload.type,
    label: payload.label,
    market: payload.market,
    currency: payload.currency,
    logoUrl: payload.logoUrl,
    lastSelectedAt: payload.lastSelectedAt,
  };
}

function toDomainFavorite(payload: FavoriteAssetPayload): FavoriteAsset {
  return {
    symbol: payload.symbol,
    assetType: payload.type,
    label: payload.label,
    market: payload.market,
    currency: payload.currency,
    logoUrl: payload.logoUrl,
    favoritedAt: payload.favoritedAt,
  };
}

function buildAssetPath(symbol: string, assetType: AssetType, suffix = "") {
  const params = new URLSearchParams();

  if (assetType === "crypto") {
    params.set("type", "crypto");
  }

  const queryString = params.toString();
  return `/ativos/${encodeURIComponent(symbol)}${suffix}${queryString ? `?${queryString}` : ""}`;
}

function buildAssetSearchPath(query: string, assetType: AssetType) {
  const params = new URLSearchParams({
    q: query,
  });

  if (assetType === "crypto") {
    params.set("type", "crypto");
  }

  return `/ativos/cache-search?${params.toString()}`;
}

async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = getSessionFromCookieValue(token);

  if (!token || !session) {
    throw new ApiRequestError(
      "Token bearer ausente ou inválido",
      401,
      "INVALID_TOKEN",
    );
  }

  return token;
}

async function requestBackendJson<T>(
  path: string,
  init: RequestInit & {
    contentType?: string | null;
  } = {},
): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.contentType
        ? {
            "content-type": init.contentType,
          }
        : {}),
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorBody | null;
    throw new ApiRequestError(
      errorPayload?.error.message ??
        `A requisição falhou com status ${response.status}`,
      response.status,
      errorPayload?.error.code,
      errorPayload,
    );
  }

  return payload as T;
}

const getRecentSelectionsCached = cache(async () => {
  const payload = await requestBackendJson<{
    data: RecentAssetSelectionPayload[];
  }>("/users/me/recent-assets");

  return payload.data.map(toDomainSelection);
});

const getFavoritesCached = cache(async () => {
  const payload = await requestBackendJson<{
    data: FavoriteAssetPayload[];
  }>("/users/me/favorites");

  return payload.data.map(toDomainFavorite);
});

const searchCachedQuotesCached = cache(
  async (query: string, assetType: AssetType) => {
    const payload = await requestBackendJson<CachedQuoteSearchResponse>(
      buildAssetSearchPath(query, assetType),
    );

    return payload.data;
  },
);

const getCachedQuoteCached = cache(async (symbol: string, assetType: AssetType) => {
  return requestBackendJson<QuoteWithCacheMeta>(
    buildAssetPath(symbol, assetType, "/cache"),
  );
});

export function getRecentSelectionsServer() {
  return getRecentSelectionsCached();
}

export function getFavoritesServer() {
  return getFavoritesCached();
}

export function searchCachedQuotesServer(query: string, assetType: AssetType) {
  return searchCachedQuotesCached(query, assetType);
}

export function getCachedQuoteServer(symbol: string, assetType: AssetType) {
  return getCachedQuoteCached(symbol, assetType);
}

export function getLiveQuoteServer(symbol: string, assetType: AssetType) {
  return requestBackendJson<QuoteWithCacheMeta>(buildAssetPath(symbol, assetType), {
    cache: "no-store",
  });
}

const getTodaySearchCountCached = cache(async () => {
  const payload = await requestBackendJson<{
    data: { count: number };
  }>("/users/me/recent-assets/today-count");

  return payload.data.count;
});

export function getTodaySearchCountServer() {
  return getTodaySearchCountCached();
}

interface MarketOverviewAsset {
  symbol: string;
  assetType: "stock";
  initialQuote: QuoteWithCacheMeta;
}

interface MarketOverviewData {
  gainers: MarketOverviewAsset[];
  losers: MarketOverviewAsset[];
}

const getMarketOverviewCached = cache(async () => {
  const payload = await requestBackendJson<{
    data: MarketOverviewData;
  }>("/ativos/market-overview", { cache: "no-store" });

  return payload.data;
});

export function getMarketOverviewServer() {
  return getMarketOverviewCached();
}
