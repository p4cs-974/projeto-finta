import type { AssetType } from "@finta/shared-kernel";

export interface TrackedAssetRef {
  symbol: string;
  assetType: AssetType;
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
}

export interface RecentAssetSelection extends TrackedAssetRef {
  lastSelectedAt: string;
}

export interface FavoriteAsset extends TrackedAssetRef {
  createdAt: string;
}

export interface IRecentAssetSelectionService {
  listRecentSelections(input: {
    userId: number;
    limit: number;
  }): Promise<RecentAssetSelection[]>;
  countTodaySelections(input: { userId: number }): Promise<number>;
  recordSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
  }): Promise<void>;
}

export interface IFavoriteAssetService {
  addFavorite(input: {
    userId: number;
    asset: TrackedAssetRef;
  }): Promise<void>;
}
