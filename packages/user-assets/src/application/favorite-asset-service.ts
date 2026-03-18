import type {
  IFavoriteAssetService,
  TrackedAssetRef,
} from "../contracts/assets";
import type { IUserFavoriteRepository } from "../ports";

export interface FavoriteAssetServiceOptions {
  userFavoriteRepository: IUserFavoriteRepository;
  now?: () => Date;
}

export class FavoriteAssetService implements IFavoriteAssetService {
  private readonly now: () => Date;

  constructor(private readonly options: FavoriteAssetServiceOptions) {
    this.now = options.now ?? (() => new Date());
  }

  async addFavorite(input: {
    userId: number;
    asset: TrackedAssetRef;
  }): Promise<void> {
    const exists = await this.options.userFavoriteRepository.hasFavorite({
      userId: input.userId,
      symbol: input.asset.symbol,
      assetType: input.asset.assetType,
    });

    if (exists) {
      return;
    }

    await this.options.userFavoriteRepository.createFavorite({
      userId: input.userId,
      asset: input.asset,
      createdAt: this.now(),
    });
  }
}
