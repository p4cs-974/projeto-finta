import type { DashboardSnapshot } from "@finta/dashboard";

import {
  formatActivityText,
  formatMoney,
  formatPercent,
  formatRelativeTime,
  getQuoteMarket,
  getQuoteSymbol,
} from "../dashboard/presentation";
import { c } from "../style";

function formatMover(
  asset: DashboardSnapshot["marketMovers"]["gainers"][number],
): string {
  const quote = asset.initialQuote;
  const symbol = getQuoteSymbol(quote);
  const change = quote.data.changePercent;
  const coloredChange =
    change >= 0
      ? c.success(formatPercent(change))
      : c.error(formatPercent(change));

  return `  ${c.brand(symbol)}  ${formatMoney(quote.data.currency, quote.data.price)}  ${coloredChange}  ${c.dim(getQuoteMarket(quote))}`;
}

export function formatDashboardText(snapshot: DashboardSnapshot): string {
  const lines: string[] = [
    c.heading("Painel"),
    `  Favoritos: ${snapshot.stats.favoritesCount}`,
    `  Buscas Hoje: ${snapshot.stats.searchesToday}`,
    `  Visualizações Hoje: ${snapshot.stats.viewsToday}`,
    `  Atualizado: ${formatRelativeTime(snapshot.generatedAt)}`,
    "",
    c.heading("Buscas Recentes"),
  ];

  if (snapshot.recentSelections.length === 0) {
    lines.push("  Ainda não há buscas recentes.");
  } else {
    for (const item of snapshot.recentSelections.slice(0, 5)) {
      lines.push(
        `  ${c.brand(item.symbol)}  ${item.label}  ${c.dim(item.assetType)}`,
      );
    }
  }

  lines.push("", c.heading("Maiores Altas"));
  if (snapshot.marketMovers.gainers.length === 0) {
    lines.push("  Nenhuma alta fresca no cache.");
  } else {
    lines.push(...snapshot.marketMovers.gainers.map(formatMover));
  }

  lines.push("", c.heading("Maiores Baixas"));
  if (snapshot.marketMovers.losers.length === 0) {
    lines.push("  Nenhuma baixa fresca no cache.");
  } else {
    lines.push(...snapshot.marketMovers.losers.map(formatMover));
  }

  lines.push("", c.heading("Atividade Recente"));
  if (snapshot.activityTimeline.length === 0) {
    lines.push("  Nenhuma atividade recente registrada ainda.");
  } else {
    for (const activity of snapshot.activityTimeline.slice(0, 6)) {
      lines.push(
        `  ${formatActivityText(activity)}  ${c.dim(formatRelativeTime(activity.createdAt))}`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
