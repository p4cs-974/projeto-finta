import { validateQuoteSearchQuery } from "@finta/price-query";
import type { TrackedAssetRef } from "@finta/user-assets";

import type { IDashboardActivityEventRepository } from "../ports";

export interface DashboardActivityServiceOptions {
  activityEventRepository: IDashboardActivityEventRepository;
  now?: () => Date;
}

export class DashboardActivityService {
  private readonly now: () => Date;

  constructor(private readonly options: DashboardActivityServiceOptions) {
    this.now = options.now ?? (() => new Date());
  }

  async recordSearch(input: {
    userId: number;
    query: string;
    assetType: "stock" | "crypto";
  }) {
    await this.options.activityEventRepository.createEvent({
      userId: input.userId,
      type: "search_performed",
      assetType: input.assetType,
      searchQuery: validateQuoteSearchQuery(input.assetType, input.query),
      createdAt: this.now(),
    });
  }

  async recordAssetView(input: {
    userId: number;
    asset: TrackedAssetRef;
  }) {
    await this.recordAssetScopedEvent({
      userId: input.userId,
      type: "asset_viewed",
      asset: input.asset,
    });
  }

  async recordFavoriteAdded(input: {
    userId: number;
    asset: TrackedAssetRef;
  }) {
    await this.recordAssetScopedEvent({
      userId: input.userId,
      type: "favorite_added",
      asset: input.asset,
    });
  }

  async recordFavoriteRemoved(input: {
    userId: number;
    asset: TrackedAssetRef;
  }) {
    await this.recordAssetScopedEvent({
      userId: input.userId,
      type: "favorite_removed",
      asset: input.asset,
    });
  }

  private async recordAssetScopedEvent(input: {
    userId: number;
    type: "asset_viewed" | "favorite_added" | "favorite_removed";
    asset: TrackedAssetRef;
  }) {
    await this.options.activityEventRepository.createEvent({
      userId: input.userId,
      type: input.type,
      symbol: input.asset.symbol,
      assetType: input.asset.assetType,
      label: input.asset.label,
      createdAt: this.now(),
    });
  }
}
