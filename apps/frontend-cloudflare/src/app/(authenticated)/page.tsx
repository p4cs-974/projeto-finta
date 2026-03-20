export const dynamic = "force-dynamic";

import { Suspense } from "react";

import {
  ActivityTimeline,
  MarketOverviewClient,
  QuickStatCard,
  RecentAssetsList,
} from "@/components/dashboard";
import { SearchCountCard } from "@/components/dashboard/search-count-card";
import {
  getFavoritesServer,
  getMarketOverviewServer,
  getRecentSelectionsServer,
  getTodaySearchCountServer,
} from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";

async function DashboardStats() {
  let favoritesCount = 0;
  let searchesToday = 0;
  let liveQuotes = 0;

  try {
    const favorites = await getFavoritesServer();
    favoritesCount = favorites.length;
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      console.error("Failed to fetch favorites:", error);
    }
  }

  try {
    searchesToday = await getTodaySearchCountServer();
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      console.error("Failed to fetch today search count:", error);
    }
  }

  try {
    const marketData = await getMarketOverviewServer();
    liveQuotes = marketData.gainers.length + marketData.losers.length;
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      console.error("Failed to fetch market overview:", error);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <QuickStatCard label="Favoritos" value={favoritesCount} icon="heart" />
      <SearchCountCard initialCount={searchesToday} />
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

async function DashboardActivityTimeline() {
  let recents: Awaited<ReturnType<typeof getRecentSelectionsServer>> = [];
  let favorites: Awaited<ReturnType<typeof getFavoritesServer>> = [];

  try {
    recents = await getRecentSelectionsServer();
  } catch {
    // silently fail
  }

  try {
    favorites = await getFavoritesServer();
  } catch {
    // silently fail
  }

  return <ActivityTimeline recentSelections={recents} favorites={favorites} />;
}

async function DashboardMarketOverview() {
  try {
    const marketData = await getMarketOverviewServer();
    return <MarketOverviewClient data={marketData} />;
  } catch (error) {
    const errorMessage =
      error instanceof ApiRequestError && error.status === 401
        ? "Sua sessão expirou. Faça login novamente."
        : "Não foi possível carregar o panorama de mercado.";

    return (
      <div className="border border-dashed border-rose-500/40 bg-rose-500/8 p-4 text-sm text-rose-700 dark:text-rose-300">
        {errorMessage}
      </div>
    );
  }
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
                <DashboardMarketOverview />
              </Suspense>
            </div>
          </div>

          <aside className="border border-border bg-card p-5 lg:p-6">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex animate-pulse items-start gap-3">
                        <div className="size-7 rounded bg-muted" />
                        <div className="flex-1 space-y-1 pt-1">
                          <div className="h-3 w-32 rounded bg-muted" />
                          <div className="h-2 w-16 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <DashboardActivityTimeline />
            </Suspense>
          </aside>
        </section>
      </div>
    </main>
  );
}
