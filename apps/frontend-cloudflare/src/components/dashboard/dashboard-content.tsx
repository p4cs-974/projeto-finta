import Link from "next/link";

import { formatRelativeTime } from "@/features/price-query/presentation";

import { ActivityTimeline } from "./activity-timeline";
import { MarketOverviewClient } from "./market-overview";
import { QuickStatCard } from "./quick-stat-card";
import { RecentAssetsList } from "./recent-assets-list";
import {
  hasDashboardPersonalData,
  type DashboardSnapshot,
} from "./types";

function DashboardEmptyState() {
  return (
    <section className="border border-dashed border-border bg-muted/25 p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Comece por aqui
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        Seu dashboard ainda não tem atividade real.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Busque um ativo para registrar visualizações recentes e adicione
        favoritos para personalizar o acompanhamento.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="inline-flex items-center border border-border bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Buscar ativos
        </Link>
        <Link
          href="/favoritos"
          className="inline-flex items-center border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Ver favoritos
        </Link>
      </div>
    </section>
  );
}

export function DashboardContent({
  dashboard,
}: {
  dashboard: DashboardSnapshot;
}) {
  const hasPersonalData = hasDashboardPersonalData(dashboard);

  return (
    <main className="flex flex-1 flex-col px-4 pb-4 md:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-8 py-6">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              label="Favoritos"
              value={dashboard.stats.favoritesCount}
              icon="heart"
            />
            <QuickStatCard
              label="Buscas Hoje"
              value={dashboard.stats.searchesToday}
              icon="search"
            />
            <QuickStatCard
              label="Visualizações Hoje"
              value={dashboard.stats.viewsToday}
              icon="trending-up"
            />
            <QuickStatCard
              label="Atualizado"
              value={formatRelativeTime(dashboard.generatedAt)}
              icon="refresh-cw"
            />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {hasPersonalData ? (
              <RecentAssetsList assets={dashboard.recentSelections} />
            ) : (
              <DashboardEmptyState />
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    Top Movers do Cache
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ranking das cotações frescas já presentes no cache.
                  </p>
                </div>
              </div>
              <MarketOverviewClient data={dashboard.marketMovers} />
            </section>
          </div>

          <aside className="border border-border bg-card p-5 lg:p-6">
            <ActivityTimeline activities={dashboard.activityTimeline} />
          </aside>
        </section>
      </div>
    </main>
  );
}
