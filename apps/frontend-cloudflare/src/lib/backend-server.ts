import "server-only";

import type { FavoriteAsset } from "@finta/favorites";
import type {
  CachedQuoteSearchResponse,
  QuoteWithCacheMeta,
} from "@finta/price-query";
import type { ApiErrorBody, AssetType } from "@finta/shared-kernel";
import type { RecentAssetSelection } from "@finta/user-assets";
import { cache } from "react";
import { cookies } from "next/headers";

import type { DashboardSnapshot } from "@/components/dashboard/types";
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

interface DashboardPayload {
  data: {
    stats: {
      favoritesCount: number;
      searchesToday: number;
      viewsToday: number;
    };
    recentSelections: RecentAssetSelectionPayload[];
    activityTimeline: Array<{
      type: DashboardSnapshot["activityTimeline"][number]["type"];
      symbol: string | null;
      assetType: AssetType | null;
      label: string | null;
      searchQuery: string | null;
      createdAt: string;
    }>;
    marketMovers: {
      gainers: Array<{
        symbol: string;
        type: AssetType;
        initialQuote: QuoteWithCacheMeta;
      }>;
      losers: Array<{
        symbol: string;
        type: AssetType;
        initialQuote: QuoteWithCacheMeta;
      }>;
    };
    generatedAt: string;
  };
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

function toDashboardSnapshot(payload: DashboardPayload): DashboardSnapshot {
  return {
    stats: payload.data.stats,
    recentSelections: payload.data.recentSelections.map(toDomainSelection),
    activityTimeline: payload.data.activityTimeline,
    marketMovers: {
      gainers: payload.data.marketMovers.gainers.map((item) => ({
        symbol: item.symbol,
        assetType: item.type,
        initialQuote: item.initialQuote,
      })),
      losers: payload.data.marketMovers.losers.map((item) => ({
        symbol: item.symbol,
        assetType: item.type,
        initialQuote: item.initialQuote,
      })),
    },
    generatedAt: payload.data.generatedAt,
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

const getDashboardCached = cache(async () => {
  const payload = await requestBackendJson<DashboardPayload>(
    "/users/me/dashboard",
    {
      cache: "no-store",
    },
  );

  return toDashboardSnapshot(payload);
});

const searchCachedQuotesCached = cache(
  async (query: string, assetType: AssetType) => {
    const payload = await requestBackendJson<CachedQuoteSearchResponse>(
      buildAssetSearchPath(query, assetType),
    );

    return payload.data;
  },
);

const getCachedQuoteCached = cache(
  async (symbol: string, assetType: AssetType) => {
    return requestBackendJson<QuoteWithCacheMeta>(
      buildAssetPath(symbol, assetType, "/cache"),
    );
  },
);

export function getRecentSelectionsServer() {
  return getRecentSelectionsCached();
}

export function getFavoritesServer() {
  return getFavoritesCached();
}

export function getDashboardServer() {
  return getDashboardCached();
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
