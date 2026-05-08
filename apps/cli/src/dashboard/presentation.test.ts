import type { DashboardSnapshot } from "@finta/dashboard";
import { describe, expect, it } from "vitest";

import {
  buildDashboardAssetRows,
  formatActivityText,
  formatMoney,
  formatRelativeTime,
} from "./presentation";

const snapshot: DashboardSnapshot = {
  stats: { favoritesCount: 1, searchesToday: 2, viewsToday: 3 },
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
  activityTimeline: [],
  marketMovers: {
    gainers: [
      {
        symbol: "BTC",
        assetType: "crypto",
        initialQuote: {
          data: {
            symbol: "BTC",
            name: "Bitcoin",
            currency: "USD",
            price: 100000,
            change: 1500,
            changePercent: 1.5,
            quotedAt: "2026-05-06T12:00:00.000Z",
            logoUrl: null,
          },
          cache: {
            key: "crypto:BTC",
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

describe("dashboard presentation", () => {
  it("builds selectable dashboard rows in render order", () => {
    expect(buildDashboardAssetRows(snapshot).map((row) => row.symbol)).toEqual([
      "PETR4",
      "BTC",
    ]);
  });

  it("formats dashboard labels using Portuguese UI vocabulary", () => {
    expect(
      formatActivityText({
        type: "asset_viewed",
        symbol: "PETR4",
        assetType: "stock",
        label: "Petrobras",
        searchQuery: null,
        createdAt: "2026-05-06T12:00:00.000Z",
      }),
    ).toBe("Visualizou PETR4");
    expect(formatMoney("BRL", 12.3)).toBe("R$ 12,30");
    expect(formatRelativeTime(new Date())).toBe("agora");
  });
});
