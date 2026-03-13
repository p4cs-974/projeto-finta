import { PriceQueryService, validateQuoteSymbol } from "@finta/price-query";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { apiError, json } from "../../../lib/http";
import { CloudflareKvQuoteSnapshotStore } from "../../price-query/cloudflare-kv-quote-snapshot-store";
import { createMarketDataGateway } from "../../price-query/create-market-data-gateway";

import { parseRequestedAssetType } from "../shared";

export async function handleGetCachedQuote(
  request: Request,
  env: AppEnv,
  rawSymbol: string,
): Promise<Response> {
  await requireAuth(request, env.JWT_SECRET);

  const assetType = parseRequestedAssetType(
    new URL(request.url).searchParams.get("type"),
  );
  const service = new PriceQueryService({
    marketDataGateway: createMarketDataGateway(env),
    quoteSnapshotStore: new CloudflareKvQuoteSnapshotStore(env.ASSET_CACHE),
  });
  const response = await service.getCachedQuote({
    assetType,
    symbol: validateQuoteSymbol(assetType, rawSymbol),
  });

  if (!response) {
    throw apiError(404, "ASSET_CACHE_MISS", "A cotação do ativo não está em cache");
  }

  return json(response);
}
