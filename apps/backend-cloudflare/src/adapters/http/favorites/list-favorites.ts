import { FavoritesService } from "@finta/favorites";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { D1FavoriteAssetRepository } from "../../favorites/d1-favorite-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

export async function handleListFavorites(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const service = new FavoritesService({
    favoriteAssetRepository: new D1FavoriteAssetRepository(env.DB),
  });
  const items = await service.listFavorites({
    userId: parseAuthenticatedUserId(auth.sub),
  });

  return json({
    data: items.map((item) => ({
      symbol: item.symbol,
      type: item.assetType,
      label: item.label,
      market: item.market,
      currency: item.currency,
      logoUrl: item.logoUrl,
      favoritedAt: item.favoritedAt,
    })),
  });
}
