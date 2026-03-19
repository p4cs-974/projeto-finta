import type {
  FavoriteAsset,
  IFavoritesService,
} from "../contracts/favorites";
import type { IFavoriteAssetRepository } from "../ports";

export interface FavoritesServiceOptions {
  favoriteAssetRepository: IFavoriteAssetRepository;
}

export class FavoritesService implements IFavoritesService {
  constructor(private readonly options: FavoritesServiceOptions) {}

  listFavorites(input: { userId: number }): Promise<FavoriteAsset[]> {
    return this.options.favoriteAssetRepository.listFavorites(input.userId);
  }
}
