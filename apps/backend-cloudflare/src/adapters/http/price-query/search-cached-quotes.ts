import {
  normalizeQuoteSearchLimit,
  PriceQueryService,
  validateQuoteSearchQuery,
} from "@finta/price-query";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { CloudflareKvQuoteSnapshotStore } from "../../price-query/cloudflare-kv-quote-snapshot-store";
import { createMarketDataGateway } from "../../price-query/create-market-data-gateway";

import { parseRequestedAssetType } from "../shared";

export async function handleSearchCachedQuotes(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  await requireAuth(request, env.JWT_SECRET);

  const url = new URL(request.url);
  const assetType = parseRequestedAssetType(url.searchParams.get("type"));
  const service = new PriceQueryService({
    marketDataGateway: createMarketDataGateway(env),
    quoteSnapshotStore: new CloudflareKvQuoteSnapshotStore(env.ASSET_CACHE),
  });
  const data = await service.searchCachedQuotes({
    assetType,
    query: validateQuoteSearchQuery(assetType, url.searchParams.get("q") ?? ""),
    limit: normalizeQuoteSearchLimit(5),
  });

  return json({ data });
}
