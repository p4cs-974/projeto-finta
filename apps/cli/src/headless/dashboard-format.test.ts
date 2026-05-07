import { describe, expect, it } from "vitest";

import { formatDashboardText } from "./dashboard-format";

import type { DashboardSnapshot } from "@finta/dashboard";

const dashboard: DashboardSnapshot = {
  stats: { favoritesCount: 2, searchesToday: 3, viewsToday: 4 },
  recentSelections: [
    {
      symbol: "PETR4",
      assetType: "stock",
      label: "Petrobras",
      logoUrl: null,
      market: "B3",
      currency: "BRL",
      lastSelectedAt: "2026-05-06T12:00:00.000Z",
    },
  ],
  activityTimeline: [
    {
      type: "asset_viewed",
      symbol: "PETR4",
      assetType: "stock",
      label: "Petrobras",
      searchQuery: null,
      createdAt: "2026-05-06T12:05:00.000Z",
    },
  ],
  marketMovers: {
    gainers: [
      {
        symbol: "AAPL",
        assetType: "stock",
        initialQuote: {
          data: {
            ticker: "AAPL",
            name: "Apple Inc.",
            market: "B3",
            currency: "USD",
            price: 190.12,
            change: 2.1,
            changePercent: 1.23,
            quotedAt: "2026-05-06T12:00:00.000Z",
            logoUrl: null,
          },
          cache: {
            key: "stock:AAPL",
            updatedAt: "2026-05-06T12:00:00.000Z",
            stale: false,
            source: "cache",
          },
        },
      },
    ],
    losers: [],
  },
  generatedAt: "2026-05-06T12:10:00.000Z",
};

describe("formatDashboardText", () => {
  it("formats the dashboard snapshot for headless output", () => {
    expect(formatDashboardText(dashboard)).toContain("Dashboard");
    expect(formatDashboardText(dashboard)).toContain("Favoritos: 2");
    expect(formatDashboardText(dashboard)).toContain("Buscas Hoje: 3");
    expect(formatDashboardText(dashboard)).toContain("PETR4");
    expect(formatDashboardText(dashboard)).toContain("AAPL");
    expect(formatDashboardText(dashboard)).toContain("+1.23%");
  });
});
