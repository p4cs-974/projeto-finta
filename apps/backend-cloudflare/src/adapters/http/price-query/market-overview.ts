import type { StockQuote } from "@finta/price-query";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { BrapiMarketDataGateway } from "../../price-query/brapi-market-data-gateway";

const OVERVIEW_SYMBOLS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "ABEV3",
  "WEGE3",
  "B3SA3",
  "MGLU3",
  "BBAS3",
  "RENT3",
];

const TOP_COUNT = 4;

function buildQuoteWithCacheMeta(quote: StockQuote) {
  const now = new Date().toISOString();
  return {
    data: quote,
    cache: {
      key: `stock:${quote.ticker}`,
      updatedAt: now,
      stale: false,
      source: "live" as const,
    },
  };
}

export async function handleMarketOverview(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  await requireAuth(request, env.JWT_SECRET);

  const gateway = new BrapiMarketDataGateway(env.BRAPI_TOKEN);
  const quotes = await gateway.fetchMultipleQuotes(OVERVIEW_SYMBOLS);

  const sorted = [...quotes].sort(
    (a, b) => b.changePercent - a.changePercent,
  );

  const gainers = sorted
    .filter((q) => q.changePercent > 0)
    .slice(0, TOP_COUNT)
    .map((q) => ({
      symbol: q.ticker,
      assetType: "stock" as const,
      initialQuote: buildQuoteWithCacheMeta(q),
    }));

  const losers = sorted
    .filter((q) => q.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, TOP_COUNT)
    .map((q) => ({
      symbol: q.ticker,
      assetType: "stock" as const,
      initialQuote: buildQuoteWithCacheMeta(q),
    }));

  return json({ data: { gainers, losers } });
}
