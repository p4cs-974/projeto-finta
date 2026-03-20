import type { AssetType } from "@finta/shared-kernel";
import type { RecentAssetSelection, TrackedAssetRef } from "@finta/user-assets";

import { requestJson } from "@/lib/http-client";

interface RecentAssetSelectionPayload {
  symbol: string;
  type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  lastSelectedAt: string;
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

export async function listRecentSelections() {
  const payload = await requestJson<{ data: RecentAssetSelectionPayload[] }>(
    "/api/users/me/recent-assets",
  );

  return payload.data.map(toDomainSelection);
}

export function recordRecentSelection(asset: TrackedAssetRef) {
  return requestJson<void>("/api/users/me/recent-assets", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      symbol: asset.symbol,
      type: asset.assetType,
      label: asset.label,
      market: asset.market,
      currency: asset.currency,
      logoUrl: asset.logoUrl,
    }),
  });
}

export function addFavorite(input: {
  symbol: string;
  assetType: AssetType;
}) {
  return requestJson<void>("/api/users/me/favorites", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      symbol: input.symbol,
      type: input.assetType,
    }),
  });
}

export function removeFavorite(input: {
  symbol: string;
  assetType: AssetType;
}) {
  return requestJson<void>("/api/users/me/favorites", {
    method: "DELETE",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      symbol: input.symbol,
      type: input.assetType,
    }),
  });
}
