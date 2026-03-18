import {
  FavoriteAssetService,
  type TrackedAssetRef,
} from "@finta/user-assets";
import {
  PriceQueryService,
  isStockQuoteWithCache,
  validateQuoteSymbol,
} from "@finta/price-query";
import { createApplicationError } from "@finta/shared-kernel";
import { z } from "zod";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { parseJsonRequest } from "../../../lib/http";
import { CloudflareKvQuoteSnapshotStore } from "../../price-query/cloudflare-kv-quote-snapshot-store";
import { createMarketDataGateway } from "../../price-query/create-market-data-gateway";
import { D1UserAssetRepository } from "../../user-assets/d1-user-asset-repository";

import { parseAuthenticatedUserId } from "../shared";

const saveFavoriteRequestSchema = z
  .object({
    symbol: z.string().trim().min(1),
    type: z.enum(["stock", "crypto"]),
  })
  .strict();

function parseSaveFavoriteRequest(input: unknown) {
  const parsed = saveFavoriteRequestSchema.safeParse(input);

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

function toTrackedAssetRef(
  quote: Awaited<ReturnType<PriceQueryService["getLiveQuote"]>>,
  assetType: TrackedAssetRef["assetType"],
): TrackedAssetRef {
  const isStockQuote = isStockQuoteWithCache(quote);

  if (assetType === "stock") {
    if (!isStockQuote) {
      throw new Error("A cotação de ativo retornada não é do tipo stock");
    }

    return {
      symbol: quote.data.ticker,
      assetType,
      label: quote.data.name,
      market: quote.data.market,
      currency: quote.data.currency,
      logoUrl: quote.data.logoUrl,
    };
  }

  if (isStockQuote) {
    throw new Error("A cotação de criptoativo retornada não é do tipo crypto");
  }

  return {
    symbol: quote.data.symbol,
    assetType,
    label: quote.data.name,
    market: null,
    currency: quote.data.currency,
    logoUrl: null,
  };
}

export async function handleAddFavorite(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const payload = parseSaveFavoriteRequest(await parseJsonRequest(request));
  const userId = parseAuthenticatedUserId(auth.sub);
  const assetType = payload.type;
  const symbol = validateQuoteSymbol(assetType, payload.symbol);
  const repository = new D1UserAssetRepository(env.DB);

  if (
    await repository.hasFavorite({
      userId,
      symbol,
      assetType,
    })
  ) {
    return new Response(null, { status: 204 });
  }

  const priceQueryService = new PriceQueryService({
    marketDataGateway: createMarketDataGateway(env),
    quoteSnapshotStore: new CloudflareKvQuoteSnapshotStore(env.ASSET_CACHE),
  });
  const quote = await priceQueryService.getLiveQuote({
    assetType,
    symbol,
  });
  const service = new FavoriteAssetService({
    userFavoriteRepository: repository,
  });

  await service.addFavorite({
    userId,
    asset: toTrackedAssetRef(quote, assetType),
  });

  return new Response(null, { status: 204 });
}
