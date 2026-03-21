import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { DashboardContent } from "./dashboard-content";
import type { DashboardSnapshot } from "./types";

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders real dashboard sections from the aggregated payload", () => {
    const html = renderToStaticMarkup(
      <DashboardContent
        dashboard={{
          stats: {
            favoritesCount: 2,
            searchesToday: 3,
            viewsToday: 4,
          },
          recentSelections: [
            {
              symbol: "BTC",
              assetType: "crypto",
              label: "Bitcoin",
              market: null,
              currency: "USD",
              logoUrl: null,
              lastSelectedAt: "2026-03-20T14:45:00.000Z",
            },
          ],
          activityTimeline: [
            {
              type: "search_performed",
              symbol: null,
              assetType: "crypto",
              label: null,
              searchQuery: "BTC",
              createdAt: "2026-03-20T14:30:00.000Z",
            },
          ],
          marketMovers: {
            gainers: [
              {
                symbol: "PETR4",
                assetType: "stock",
                initialQuote: {
                  data: {
                    ticker: "PETR4",
                    name: "Petrobras PN",
                    price: 38.45,
                    change: 1.23,
                    changePercent: 3.31,
                    currency: "BRL",
                    market: "B3",
                    quotedAt: "2026-03-20T14:59:00.000Z",
                    logoUrl: null,
                  },
                  cache: {
                    key: "asset-quote:v1:PETR4",
                    updatedAt: "2026-03-20T14:59:00.000Z",
                    stale: false,
                    source: "cache",
                  },
                },
              },
            ],
            losers: [],
          },
          generatedAt: "2026-03-20T15:00:00.000Z",
        } satisfies DashboardSnapshot}
      />,
    );

    expect(html).toContain("Favoritos");
    expect(html).toContain("Visualizações Hoje");
    expect(html).toContain("Buscas Recentes");
    expect(html).toContain("Buscou por BTC");
    expect(html).toContain("Top Movers do Cache");
  });

  it("renders the empty-state guidance when there is no personal data or fresh movers", () => {
    const html = renderToStaticMarkup(
      <DashboardContent
        dashboard={{
          stats: {
            favoritesCount: 0,
            searchesToday: 0,
            viewsToday: 0,
          },
          recentSelections: [],
          activityTimeline: [],
          marketMovers: {
            gainers: [],
            losers: [],
          },
          generatedAt: "2026-03-20T15:00:00.000Z",
        }}
      />,
    );

    expect(html).toContain("Seu dashboard ainda não tem atividade real.");
    expect(html).toContain(
      "Ainda não há cotações frescas suficientes no cache para montar os movers.",
    );
    expect(html).toContain("Nenhuma atividade recente registrada ainda.");
  });
});
