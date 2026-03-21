import { DashboardActivityService } from "@finta/dashboard";
import { FavoriteAssetService } from "@finta/user-assets";
import { validateQuoteSymbol } from "@finta/price-query";
import { createApplicationError } from "@finta/shared-kernel";
import { z } from "zod";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { parseJsonRequest } from "../../../lib/http";
import { D1UserActivityEventRepository } from "../../dashboard/d1-user-activity-event-repository";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

const removeFavoriteRequestSchema = z
  .object({
    symbol: z.string().trim().min(1),
    type: z.enum(["stock", "crypto"]),
  })
  .strict();

function parseRemoveFavoriteRequest(input: unknown) {
  const parsed = removeFavoriteRequestSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw createApplicationError(
    422,
    "VALIDATION_ERROR",
    "Corpo da requisição inválido",
    {
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  );
}

export async function handleRemoveFavorite(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const payload = parseRemoveFavoriteRequest(await parseJsonRequest(request));
  const userId = parseAuthenticatedUserId(auth.sub);
  const repository = new D1UserAssetRepository(env.DB);
  const service = new FavoriteAssetService({
    userFavoriteRepository: repository,
  });
  const assetType = payload.type;
  const symbol = validateQuoteSymbol(assetType, payload.symbol);
  const favorite = await repository.getFavorite({
    userId,
    symbol,
    assetType,
  });

  await service.removeFavorite({
    userId,
    symbol,
    assetType,
  });

  if (favorite) {
    const activityService = new DashboardActivityService({
      activityEventRepository: new D1UserActivityEventRepository(env.DB),
    });

    await activityService.recordFavoriteRemoved({
      userId,
      asset: {
        symbol: favorite.symbol,
        assetType: favorite.assetType,
        label: favorite.label,
        market: favorite.market,
        currency: favorite.currency,
        logoUrl: favorite.logoUrl,
      },
    });
  }

  return new Response(null, { status: 204 });
}
