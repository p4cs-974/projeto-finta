import { DashboardActivityService } from "@finta/dashboard";
import { validateQuoteSymbol } from "@finta/price-query";
import {
  parseTrackedAssetRefInput,
  RecentAssetSelectionService,
} from "@finta/user-assets";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { parseJsonRequest } from "../../../lib/http";
import { D1UserActivityEventRepository } from "../../dashboard/d1-user-activity-event-repository";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

export async function handleRecordRecentSelection(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const payload = (await parseJsonRequest(request)) as {
    symbol?: unknown;
    type?: unknown;
    label?: unknown;
    market?: unknown;
    currency?: unknown;
    logoUrl?: unknown;
  };
  const asset = parseTrackedAssetRefInput({
    symbol: payload.symbol,
    assetType: payload.type,
    label: payload.label,
    market: payload.market,
    currency: payload.currency,
    logoUrl: payload.logoUrl,
  });
  const now = new Date();
  const service = new RecentAssetSelectionService({
    userAssetRepository: new D1UserAssetRepository(env.DB),
    now: () => now,
  });
  const activityService = new DashboardActivityService({
    activityEventRepository: new D1UserActivityEventRepository(env.DB),
    now: () => now,
  });
  const userId = parseAuthenticatedUserId(auth.sub);
  const symbol = validateQuoteSymbol(asset.assetType, asset.symbol);
  const normalizedAsset = {
    ...asset,
    symbol,
  };

  await service.recordSelection({
    userId,
    asset: normalizedAsset,
  });
  await activityService.recordAssetView({
    userId,
    asset: normalizedAsset,
  });

  return new Response(null, { status: 204 });
}
