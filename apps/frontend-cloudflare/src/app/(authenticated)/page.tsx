import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import { Suspense } from "react";

import {
  ActivityTimeline,
  MarketOverviewClient,
  QuickStatCard,
  RecentAssetsList,
} from "@/components/dashboard";
import {
  getFavoritesServer,
  getRecentSelectionsServer,
} from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";

interface MarketAsset {
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta;
}

interface MockMarketData {
  gainers: MarketAsset[];
  losers: MarketAsset[];
}

const now = new Date().toISOString();

const mockMarketData: MockMarketData = {
  gainers: [
    {
      symbol: "PETR4",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "PETR4",
          name: "Petrobras PN N2",
          price: 38.45,
          change: 1.23,
          changePercent: 3.31,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:PETR4",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "BTC",
      assetType: "crypto",
      initialQuote: {
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          price: 67432.18,
          change: 1245.67,
          changePercent: 1.88,
          currency: "USD",
          quotedAt: now,
        },
        cache: {
          key: "crypto:BTC",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "BBDC4",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "BBDC4",
          name: "Bradesco PN N2",
          price: 14.82,
          change: 0.41,
          changePercent: 2.85,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:BBDC4",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "ETH",
      assetType: "crypto",
      initialQuote: {
        data: {
          symbol: "ETH",
          name: "Ethereum",
          price: 3421.56,
          change: 89.23,
          changePercent: 2.68,
          currency: "USD",
          quotedAt: now,
        },
        cache: {
          key: "crypto:ETH",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
  ],
  losers: [
    {
      symbol: "VALE3",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "VALE3",
          name: "Vale ON N2",
          price: 62.14,
          change: -2.31,
          changePercent: -3.59,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:VALE3",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "ITUB4",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "ITUB4",
          name: "Itaú Unibanco PN N2",
          price: 32.78,
          change: -1.12,
          changePercent: -3.3,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:ITUB4",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "ABEV3",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "ABEV3",
          name: "Ambev S/A ON N2",
          price: 12.45,
          change: -0.34,
          changePercent: -2.66,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:ABEV3",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
    {
      symbol: "WDOFUT",
      assetType: "stock",
      initialQuote: {
        data: {
          ticker: "WDOFUT",
          name: "Mini Dólar Futuro",
          price: 5.421,
          change: -0.087,
          changePercent: -1.58,
          currency: "BRL",
          market: "B3",
          quotedAt: now,
          logoUrl: null,
        },
        cache: {
          key: "stock:WDOFUT",
          updatedAt: now,
          stale: false,
          source: "live",
        },
      },
    },
  ],
};

async function DashboardStats() {
  let favoritesCount = 0;
  let searchesToday = 8;
  let liveQuotes = 3;
  let recentsLength = 0;

  try {
    const favorites = await getFavoritesServer();
    favoritesCount = favorites.length;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
    } else {
      console.error("Failed to fetch favorites:", error);
    }
  }

  try {
    const recents = await getRecentSelectionsServer();
    recentsLength = recents.length;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
    } else {
      console.error("Failed to fetch recent selections:", error);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <QuickStatCard label="Favoritos" value={favoritesCount} icon="heart" />
      <QuickStatCard label="Buscas Hoje" value={searchesToday} icon="search" />
      <QuickStatCard
        label="Cotações Ativas"
        value={liveQuotes}
        icon="trending-up"
      />
      <QuickStatCard label="Atualizado" value="Agora" icon="refresh-cw" />
    </div>
  );
}

async function DashboardRecentAssets() {
  let recents = [];

  try {
    recents = await getRecentSelectionsServer();
  } catch (error) {
    const errorMessage =
      error instanceof ApiRequestError && error.status === 401
        ? "Sua sessão expirou. Faça login novamente."
        : "Não foi possível carregar o histórico recente.";

    return (
      <div className="border border-dashed border-rose-500/40 bg-rose-500/8 p-4 text-sm text-rose-700 dark:text-rose-300">
        {errorMessage}
      </div>
    );
  }

  return <RecentAssetsList assets={recents} />;
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="mt-2 h-8 w-12 rounded bg-muted" />
            </div>
            <div className="size-10 shrink-0 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse border border-border bg-background px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-1 h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((col) => (
        <div key={col} className="space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-16 rounded bg-muted" />
                    <div className="mt-1 h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col px-4 pb-4 md:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-8 py-6">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <Suspense fallback={<StatsSkeleton />}>
            <DashboardStats />
          </Suspense>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Suspense fallback={<RecentSkeleton />}>
                <DashboardRecentAssets />
              </Suspense>
            </div>

            <div className="space-y-3">
              <Suspense fallback={<MarketSkeleton />}>
                <MarketOverviewClient data={mockMarketData} />
              </Suspense>
            </div>
          </div>

          <aside className="border border-border bg-card p-5 lg:p-6">
            <ActivityTimeline />
          </aside>
        </section>
      </div>
    </main>
  );
}
