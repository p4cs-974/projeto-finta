import { PriceQueryService, validateQuoteSymbol } from "@finta/price-query";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { CloudflareKvQuoteSnapshotStore } from "../../price-query/cloudflare-kv-quote-snapshot-store";
import { createMarketDataGateway } from "../../price-query/create-market-data-gateway";

import { parseRequestedAssetType } from "../shared";

export async function handleGetLiveQuote(
  request: Request,
  env: AppEnv,
  ctx: ExecutionContext,
  rawSymbol: string,
): Promise<Response> {
  await requireAuth(request, env.JWT_SECRET, env.DB);

  const assetType = parseRequestedAssetType(
    new URL(request.url).searchParams.get("type"),
  );
  const service = new PriceQueryService({
    marketDataGateway: createMarketDataGateway(env),
    quoteSnapshotStore: new CloudflareKvQuoteSnapshotStore(env.ASSET_CACHE),
    scheduleTask(task) {
      ctx.waitUntil(task);
    },
    onRefreshError(error, input) {
      console.error("Failed to refresh asset quote cache", {
        assetType: input.assetType,
        symbol: input.symbol,
        error,
      });
    },
  });
  const response = await service.getLiveQuote({
    assetType,
    symbol: validateQuoteSymbol(assetType, rawSymbol),
  });

  return json(response);
}
