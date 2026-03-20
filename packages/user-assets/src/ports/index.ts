import type {
  RecentAssetSelection,
  TrackedAssetRef,
} from "../contracts/assets";

export interface IUserAssetRepository {
  listRecentSelections(
    userId: number,
    limit: number,
  ): Promise<RecentAssetSelection[]>;
  countTodaySelections(userId: number, today: string): Promise<number>;
  upsertRecentSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
    selectedAt: Date;
  }): Promise<void>;
  trimRecentSelections(userId: number, keep: number): Promise<void>;
  recordSearchEvent(input: {
    userId: number;
    symbol: string;
    assetType: TrackedAssetRef["assetType"];
    searchedAt: Date;
  }): Promise<void>;
}

export interface IUserFavoriteRepository {
  hasFavorite(input: {
    userId: number;
    symbol: string;
    assetType: TrackedAssetRef["assetType"];
  }): Promise<boolean>;
  createFavorite(input: {
    userId: number;
    asset: TrackedAssetRef;
    createdAt: Date;
  }): Promise<void>;
}
