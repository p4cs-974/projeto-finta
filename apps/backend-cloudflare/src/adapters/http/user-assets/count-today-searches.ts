import { RecentAssetSelectionService } from "@finta/user-assets";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

export async function handleCountTodaySearches(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const service = new RecentAssetSelectionService({
    userAssetRepository: new D1UserAssetRepository(env.DB),
  });
  const count = await service.countTodaySelections({
    userId: parseAuthenticatedUserId(auth.sub),
  });

  return json({ data: { count } });
}
