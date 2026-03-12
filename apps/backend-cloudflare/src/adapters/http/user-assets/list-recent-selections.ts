import { RecentAssetSelectionService } from "@finta/user-assets";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

export async function handleListRecentSelections(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const service = new RecentAssetSelectionService({
    userAssetRepository: new D1UserAssetRepository(env.DB),
  });
  const items = await service.listRecentSelections({
    userId: parseAuthenticatedUserId(auth.sub),
    limit: 5,
  });

  return json({
    data: items.map((item) => ({
      symbol: item.symbol,
      type: item.assetType,
      label: item.label,
      market: item.market,
      currency: item.currency,
      logoUrl: item.logoUrl,
      lastSelectedAt: item.lastSelectedAt,
    })),
  });
}
