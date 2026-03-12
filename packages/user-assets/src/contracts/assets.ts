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

export interface IRecentAssetSelectionService {
  listRecentSelections(input: {
    userId: number;
    limit: number;
  }): Promise<RecentAssetSelection[]>;
  recordSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
  }): Promise<void>;
}
