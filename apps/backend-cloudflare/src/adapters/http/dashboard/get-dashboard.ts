import { DashboardService } from "@finta/dashboard";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { D1FavoriteAssetRepository } from "../../favorites/d1-favorite-asset-repository";
import { D1UserActivityEventRepository } from "../../dashboard/d1-user-activity-event-repository";
import { CloudflareKvDashboardMarketMoversProvider } from "../../dashboard/market-movers";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

export async function handleGetDashboard(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET, env.DB);
  const userId = parseAuthenticatedUserId(auth.sub);
  const service = new DashboardService({
    favoritesReader: new D1FavoriteAssetRepository(env.DB),
    recentSelectionsReader: new D1UserAssetRepository(env.DB),
    activityEventRepository: new D1UserActivityEventRepository(env.DB),
    marketMoversProvider: new CloudflareKvDashboardMarketMoversProvider(
      env.ASSET_CACHE,
    ),
  });
  const snapshot = await service.getSnapshot({ userId });

  return json({
    data: {
      stats: snapshot.stats,
      recentSelections: snapshot.recentSelections.map((item) => ({
        symbol: item.symbol,
        type: item.assetType,
        label: item.label,
        market: item.market,
        currency: item.currency,
        logoUrl: item.logoUrl,
        lastSelectedAt: item.lastSelectedAt,
      })),
      activityTimeline: snapshot.activityTimeline.map((item) => ({
        type: item.type,
        symbol: item.symbol,
        assetType: item.assetType,
        label: item.label,
        searchQuery: item.searchQuery,
        createdAt: item.createdAt,
      })),
      marketMovers: {
        gainers: snapshot.marketMovers.gainers.map((item) => ({
          symbol: item.symbol,
          type: item.assetType,
          initialQuote: item.initialQuote,
        })),
        losers: snapshot.marketMovers.losers.map((item) => ({
          symbol: item.symbol,
          type: item.assetType,
          initialQuote: item.initialQuote,
        })),
      },
      generatedAt: snapshot.generatedAt,
    },
  });
}
