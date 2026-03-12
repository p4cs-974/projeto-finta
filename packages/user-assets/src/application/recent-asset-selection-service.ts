import type {
  IRecentAssetSelectionService,
  RecentAssetSelection,
  TrackedAssetRef,
} from "../contracts/assets";
import type { IUserAssetRepository } from "../ports";

export interface RecentAssetSelectionServiceOptions {
  userAssetRepository: IUserAssetRepository;
  now?: () => Date;
  keep?: number;
}

export class RecentAssetSelectionService implements IRecentAssetSelectionService {
  private readonly now: () => Date;
  private readonly keep: number;

  constructor(private readonly options: RecentAssetSelectionServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.keep = options.keep ?? 5;
  }

  listRecentSelections(input: { userId: number; limit: number }) {
    return this.options.userAssetRepository.listRecentSelections(
      input.userId,
      input.limit,
    );
  }

  async recordSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
  }): Promise<void> {
    await this.options.userAssetRepository.upsertRecentSelection({
      userId: input.userId,
      asset: input.asset,
      selectedAt: this.now(),
    });
    await this.options.userAssetRepository.trimRecentSelections(
      input.userId,
      this.keep,
    );
  }
}
