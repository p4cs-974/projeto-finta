import type { FavoriteAsset } from "@finta/favorites";
import type { RecentAssetSelection } from "@finta/user-assets";
import { Heart, Search } from "lucide-react";

interface ActivityEntry {
  type: "favorite" | "search";
  symbol: string;
  label: string;
  timestamp: string;
}

function buildTimeline(
  recentSelections: RecentAssetSelection[],
  favorites: FavoriteAsset[],
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const item of recentSelections) {
    entries.push({
      type: "search",
      symbol: item.symbol,
      label: item.label,
      timestamp: item.lastSelectedAt,
    });
  }

  for (const item of favorites) {
    entries.push({
      type: "favorite",
      symbol: item.symbol,
      label: item.label,
      timestamp: item.favoritedAt,
    });
  }

  entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return entries.slice(0, 8);
}

function getActivityIcon(type: ActivityEntry["type"]) {
  return type === "favorite" ? Heart : Search;
}

function getActivityText(activity: ActivityEntry) {
  return activity.type === "favorite"
    ? `Adicionou ${activity.symbol} aos favoritos`
    : `Buscou por ${activity.symbol}`;
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

interface ActivityTimelineProps {
  recentSelections: RecentAssetSelection[];
  favorites: FavoriteAsset[];
}

export function ActivityTimeline({
  recentSelections,
  favorites,
}: ActivityTimelineProps) {
  const entries = buildTimeline(recentSelections, favorites);

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Atividade Recente
        </p>
        <p className="text-sm text-muted-foreground">
          Nenhuma atividade ainda. Comece buscando um ativo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Atividade Recente
      </p>
      <ul className="space-y-3">
        {entries.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);

          return (
            <li key={`${activity.type}:${activity.symbol}:${activity.timestamp}`} className="flex items-start gap-3">
              <div className="relative">
                <div className="flex size-7 items-center justify-center border border-border bg-card">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                {index < entries.length - 1 && (
                  <div className="absolute top-7 left-1/2 h-full w-px -translate-x-1/2 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm text-foreground">
                  {getActivityText(activity)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
