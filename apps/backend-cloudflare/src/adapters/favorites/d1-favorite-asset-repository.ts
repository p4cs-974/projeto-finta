import type {
  FavoriteAsset,
  IFavoriteAssetRepository,
} from "@finta/favorites";

interface FavoriteAssetRecord {
  id: number;
  user_id: number;
  symbol: string;
  asset_type: "stock" | "crypto";
  label: string;
  market: string | null;
  currency: string | null;
  logo_url: string | null;
  favorited_at: string;
}

export class D1FavoriteAssetRepository implements IFavoriteAssetRepository {
  constructor(private readonly db: D1Database) {}

  async listFavorites(userId: number): Promise<FavoriteAsset[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, favorited_at",
          "FROM favorite_assets",
          "WHERE user_id = ?",
          "ORDER BY favorited_at DESC, id DESC",
        ].join(" "),
      )
      .bind(userId)
      .all<FavoriteAssetRecord>();

    return (result.results ?? []).map((item) => ({
      symbol: item.symbol,
      assetType: item.asset_type,
      label: item.label,
      market: item.market,
      currency: item.currency,
      logoUrl: item.logo_url,
      favoritedAt: item.favorited_at,
    }));
  }
}
