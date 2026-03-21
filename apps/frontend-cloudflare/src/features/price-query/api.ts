import type {
  CachedQuoteSearchResponse,
  QuoteWithCacheMeta,
} from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";

import { requestJson } from "@/lib/http-client";

function buildAssetPath(symbol: string, assetType: AssetType, suffix = "") {
  const params = new URLSearchParams();

  if (assetType === "crypto") {
    params.set("type", "crypto");
  }

  const queryString = params.toString();
  return `/api/assets/${encodeURIComponent(symbol)}${suffix}${queryString ? `?${queryString}` : ""}`;
}

function buildAssetSearchPath(query: string, assetType: AssetType) {
  const params = new URLSearchParams({
    q: query,
  });

  if (assetType === "crypto") {
    params.set("type", "crypto");
  }

  return `/api/assets/search?${params.toString()}`;
}

export function getLiveQuote(symbol: string, assetType: AssetType) {
  return requestJson<QuoteWithCacheMeta>(buildAssetPath(symbol, assetType));
}

export function getCachedQuote(symbol: string, assetType: AssetType) {
  return requestJson<QuoteWithCacheMeta>(
    buildAssetPath(symbol, assetType, "/cache"),
  );
}

export async function searchCachedQuotes(query: string, assetType: AssetType) {
  const payload = await requestJson<CachedQuoteSearchResponse>(
    buildAssetSearchPath(query, assetType),
  );

  return payload.data;
}

export function recordSearchActivity(query: string, assetType: AssetType) {
  return requestJson<void>("/api/users/me/activity/searches", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      query,
      type: assetType,
    }),
  });
}
