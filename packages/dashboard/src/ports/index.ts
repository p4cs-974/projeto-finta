import type { FavoriteAsset } from "@finta/favorites";
import type { AssetType } from "@finta/shared-kernel";
import type { RecentAssetSelection } from "@finta/user-assets";

import type {
  DashboardActivityEvent,
  DashboardActivityType,
  DashboardMarketMovers,
} from "../contracts/dashboard";

export interface IDashboardFavoritesReader {
  listFavorites(userId: number): Promise<FavoriteAsset[]>;
}

export interface IDashboardRecentSelectionsReader {
  listRecentSelections(
    userId: number,
    limit: number,
  ): Promise<RecentAssetSelection[]>;
}

export interface IDashboardActivityEventRepository {
  listRecentEvents(
    userId: number,
    limit: number,
  ): Promise<DashboardActivityEvent[]>;
  countEventsByTypeInRange(input: {
    userId: number;
    type: DashboardActivityType;
    startAt: string;
    endAt: string;
  }): Promise<number>;
  createEvent(input: {
    userId: number;
    type: DashboardActivityType;
    symbol?: string | null;
    assetType?: AssetType | null;
    label?: string | null;
    searchQuery?: string | null;
    createdAt: Date;
  }): Promise<void>;
}

export interface IDashboardMarketMoversProvider {
  getMarketMovers(now: Date): Promise<DashboardMarketMovers>;
}
