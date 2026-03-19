import { Heart, Search, TrendingUp } from "lucide-react";

interface Activity {
  type: "favorite" | "search" | "view";
  symbol: string;
  label: string;
  timestamp: string;
}

const mockActivities: Activity[] = [
  {
    type: "favorite",
    symbol: "PETR4",
    label: "Petrobras PN",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    type: "search",
    symbol: "VALE3",
    label: "Vale ON",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    type: "view",
    symbol: "BTC-USD",
    label: "Bitcoin",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    type: "favorite",
    symbol: "ETH-USD",
    label: "Ethereum",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "favorite":
      return Heart;
    case "search":
      return Search;
    case "view":
      return TrendingUp;
  }
}

function getActivityText(activity: Activity) {
  switch (activity.type) {
    case "favorite":
      return `Adicionou ${activity.symbol} aos favoritos`;
    case "search":
      return `Buscou por ${activity.symbol}`;
    case "view":
      return `Visualizou ${activity.symbol}`;
  }
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

export function ActivityTimeline() {
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Atividade Recente
      </p>
      <ul className="space-y-3">
        {mockActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);

          return (
            <li key={index} className="flex items-start gap-3">
              <div className="relative">
                <div className="flex size-7 items-center justify-center border border-border bg-card">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                {index < mockActivities.length - 1 && (
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
