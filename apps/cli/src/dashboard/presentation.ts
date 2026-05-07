import type {
  DashboardActivityEvent,
  DashboardMarketAsset,
  DashboardSnapshot,
} from "@finta/dashboard";
import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";

export type DashboardAssetRow = {
  key: string;
  section: "recent" | "gainer" | "loser";
  symbol: string;
  assetType: AssetType;
  label: string;
  quote?: QuoteWithCacheMeta;
};

export function getDashboardAssetKey(symbol: string, assetType: AssetType) {
  return `${assetType}:${symbol}`;
}

export function getQuoteSymbol(quote: QuoteWithCacheMeta): string {
  return "ticker" in quote.data ? quote.data.ticker : quote.data.symbol;
}

export function getQuoteMarket(quote: QuoteWithCacheMeta): string {
  return "ticker" in quote.data ? quote.data.market : "Cripto";
}

export function formatMoney(currency: string, value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (Math.abs(diffMinutes) < 1) {
    return "agora";
  }

  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMs / 3_600_000);

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffMs / 86_400_000);
  return rtf.format(diffDays, "day");
}

export function formatActivityText(activity: DashboardActivityEvent) {
  switch (activity.type) {
    case "favorite_added":
      return `Adicionou ${activity.symbol ?? activity.label ?? "o ativo"} aos favoritos`;
    case "favorite_removed":
      return `Removeu ${activity.symbol ?? activity.label ?? "o ativo"} dos favoritos`;
    case "search_performed":
      return `Buscou por ${activity.searchQuery ?? activity.symbol ?? "um ativo"}`;
    case "asset_viewed":
      return `Visualizou ${activity.symbol ?? activity.label ?? "o ativo"}`;
  }
}

function marketRow(
  section: "gainer" | "loser",
  asset: DashboardMarketAsset,
): DashboardAssetRow {
  return {
    key: `${section}:${getDashboardAssetKey(asset.symbol, asset.assetType)}`,
    section,
    symbol: asset.symbol,
    assetType: asset.assetType,
    label: asset.initialQuote.data.name,
    quote: asset.initialQuote,
  };
}

export function buildDashboardAssetRows(
  snapshot: DashboardSnapshot,
): DashboardAssetRow[] {
  return [
    ...snapshot.recentSelections.slice(0, 5).map((asset) => ({
      key: `recent:${getDashboardAssetKey(asset.symbol, asset.assetType)}`,
      section: "recent" as const,
      symbol: asset.symbol,
      assetType: asset.assetType,
      label: asset.label,
    })),
    ...snapshot.marketMovers.gainers
      .slice(0, 3)
      .map((asset) => marketRow("gainer", asset)),
    ...snapshot.marketMovers.losers
      .slice(0, 3)
      .map((asset) => marketRow("loser", asset)),
  ];
}

export function buildDashboardInitialQuotes(
  snapshot: DashboardSnapshot,
): Map<string, QuoteWithCacheMeta> {
  const quotes = new Map<string, QuoteWithCacheMeta>();
  for (const asset of [
    ...snapshot.marketMovers.gainers,
    ...snapshot.marketMovers.losers,
  ]) {
    quotes.set(
      getDashboardAssetKey(asset.symbol, asset.assetType),
      asset.initialQuote,
    );
  }
  return quotes;
}

export function buildDashboardStreamConfigs(
  snapshot: DashboardSnapshot,
): Array<{ symbol: string; assetType: AssetType }> {
  return [
    ...snapshot.marketMovers.gainers,
    ...snapshot.marketMovers.losers,
  ].map((asset) => ({
    symbol: asset.symbol,
    assetType: asset.assetType,
  }));
}
