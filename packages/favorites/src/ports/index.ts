import type { FavoriteAsset } from "../contracts/favorites";

export interface IFavoriteAssetRepository {
  listFavorites(userId: number): Promise<FavoriteAsset[]>;
}
