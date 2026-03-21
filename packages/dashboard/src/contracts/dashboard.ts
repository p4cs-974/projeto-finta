import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import type { RecentAssetSelection } from "@finta/user-assets";

export const DASHBOARD_ACTIVITY_TYPES = [
  "search_performed",
  "asset_viewed",
  "favorite_added",
  "favorite_removed",
] as const;

export type DashboardActivityType =
  (typeof DASHBOARD_ACTIVITY_TYPES)[number];

export interface DashboardActivityEvent {
  type: DashboardActivityType;
  symbol: string | null;
  assetType: AssetType | null;
  label: string | null;
  searchQuery: string | null;
  createdAt: string;
}

export interface DashboardMarketAsset {
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta;
}

export interface DashboardMarketMovers {
  gainers: DashboardMarketAsset[];
  losers: DashboardMarketAsset[];
}

export interface DashboardSnapshot {
  stats: {
    favoritesCount: number;
    searchesToday: number;
    viewsToday: number;
  };
  recentSelections: RecentAssetSelection[];
  activityTimeline: DashboardActivityEvent[];
  marketMovers: DashboardMarketMovers;
  generatedAt: string;
}
