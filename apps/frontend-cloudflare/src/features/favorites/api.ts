import type { FavoriteAsset } from "@finta/favorites";

import { requestJson } from "@/lib/http-client";

interface FavoriteAssetPayload {
  symbol: string;
  type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  favoritedAt: string;
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

export async function listFavorites() {
  const payload = await requestJson<{ data: FavoriteAssetPayload[] }>(
    "/api/users/me/favorites",
  );

  return payload.data.map(toDomainFavorite);
}
