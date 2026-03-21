export type {
  DashboardActivityEvent as DashboardActivityItem,
  DashboardActivityType,
  DashboardMarketAsset,
  DashboardMarketMovers,
  DashboardSnapshot,
} from "@finta/dashboard";

import type { DashboardSnapshot } from "@finta/dashboard";

export function hasDashboardPersonalData(snapshot: DashboardSnapshot) {
  return (
    snapshot.stats.favoritesCount > 0 ||
    snapshot.recentSelections.length > 0 ||
    snapshot.activityTimeline.length > 0
  );
}
