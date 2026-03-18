import type {
  IUserFavoriteRepository,
  IUserAssetRepository,
  RecentAssetSelection,
  TrackedAssetRef,
} from "@finta/user-assets";

interface RecentAssetSelectionRecord {
  id: number;
  user_id: number;
  symbol: string;
  asset_type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logo_url: string | null;
  last_selected_at: string;
}

export class D1UserAssetRepository
  implements IUserAssetRepository, IUserFavoriteRepository
{
  constructor(private readonly db: D1Database) {}

  async listRecentSelections(userId: number, limit: number) {
    const result = await this.db
      .prepare(
        [
          "SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at",
          "FROM recent_asset_selections",
          "WHERE user_id = ?",
          "ORDER BY last_selected_at DESC, id DESC",
          "LIMIT ?",
        ].join(" "),
      )
      .bind(userId, limit)
      .all<RecentAssetSelectionRecord>();

    return (result.results ?? []).map(
      (item): RecentAssetSelection => ({
        symbol: item.symbol,
        assetType: item.asset_type,
        label: item.label,
        market: item.market,
        currency: item.currency,
        logoUrl: item.logo_url,
        lastSelectedAt: item.last_selected_at,
      }),
    );
  }

  async upsertRecentSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
    selectedAt: Date;
  }) {
    await this.db
      .prepare(
        [
          "INSERT INTO recent_asset_selections",
          "(user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(user_id, symbol, asset_type) DO UPDATE SET",
          "label = excluded.label,",
          "market = excluded.market,",
          "currency = excluded.currency,",
          "logo_url = excluded.logo_url,",
          "last_selected_at = excluded.last_selected_at",
        ].join(" "),
      )
      .bind(
        input.userId,
        input.asset.symbol,
        input.asset.assetType,
        input.asset.label,
        input.asset.market,
        input.asset.currency,
        input.asset.logoUrl,
        input.selectedAt.toISOString(),
      )
      .run();
  }

  async trimRecentSelections(userId: number, keep: number) {
    await this.db
      .prepare(
        [
          "DELETE FROM recent_asset_selections",
          "WHERE user_id = ?",
          "AND id IN (",
          "SELECT id FROM recent_asset_selections",
          "WHERE user_id = ?",
          "ORDER BY last_selected_at DESC, id DESC",
          "LIMIT -1 OFFSET ?",
          ")",
        ].join(" "),
      )
      .bind(userId, userId, keep)
      .run();
  }

  async hasFavorite(input: {
    userId: number;
    symbol: string;
    assetType: TrackedAssetRef["assetType"];
  }) {
    const result = await this.db
      .prepare(
        [
          "SELECT id",
          "FROM favorite_assets",
          "WHERE user_id = ? AND symbol = ? AND asset_type = ?",
          "LIMIT 1",
        ].join(" "),
      )
      .bind(input.userId, input.symbol, input.assetType)
      .first<{ id: number }>();

    return result !== null;
  }

  async createFavorite(input: {
    userId: number;
    asset: TrackedAssetRef;
    createdAt: Date;
  }) {
    await this.db
      .prepare(
        [
          "INSERT OR IGNORE INTO favorite_assets",
          "(user_id, symbol, asset_type, label, market, currency, logo_url, created_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        input.userId,
        input.asset.symbol,
        input.asset.assetType,
        input.asset.label,
        input.asset.market,
        input.asset.currency,
        input.asset.logoUrl,
        input.createdAt.toISOString(),
      )
      .run();
  }
}
