import { Eye, Heart, Search, StarOff } from "lucide-react";

import { formatRelativeTime } from "@/features/price-query/presentation";

import type { DashboardActivityItem } from "./types";

function getActivityIcon(type: DashboardActivityItem["type"]) {
  switch (type) {
    case "favorite_added":
      return Heart;
    case "favorite_removed":
      return StarOff;
    case "search_performed":
      return Search;
    case "asset_viewed":
      return Eye;
  }
}

function getActivityText(activity: DashboardActivityItem) {
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

export function ActivityTimeline({
  activities,
}: {
  activities: DashboardActivityItem[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Atividade Recente
      </p>

      {activities.length === 0 ? (
        <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhuma atividade recente registrada ainda.
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);

            return (
              <li
                key={`${activity.type}:${activity.createdAt}:${activity.symbol ?? activity.searchQuery ?? index}`}
                className="flex items-start gap-3"
              >
                <div className="relative">
                  <div className="flex size-7 items-center justify-center border border-border bg-card">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute top-7 left-1/2 h-full w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm text-foreground">
                    {getActivityText(activity)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
