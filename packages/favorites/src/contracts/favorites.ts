import type { AssetType } from "@finta/shared-kernel";

export interface FavoriteAsset {
  symbol: string;
  assetType: AssetType;
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
  favoritedAt: string;
}

export interface IFavoritesService {
  listFavorites(input: { userId: number }): Promise<FavoriteAsset[]>;
}
