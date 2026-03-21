import type { IDashboardActivityEventRepository, IDashboardFavoritesReader, IDashboardMarketMoversProvider, IDashboardRecentSelectionsReader } from "../ports";
import type { DashboardSnapshot } from "../contracts/dashboard";

import { getDayBoundsInTimeZone } from "./timezone";

export interface DashboardServiceOptions {
  favoritesReader: IDashboardFavoritesReader;
  recentSelectionsReader: IDashboardRecentSelectionsReader;
  activityEventRepository: IDashboardActivityEventRepository;
  marketMoversProvider: IDashboardMarketMoversProvider;
  now?: () => Date;
  timeZone?: string;
  recentSelectionsLimit?: number;
  timelineLimit?: number;
}

export class DashboardService {
  private readonly now: () => Date;
  private readonly timeZone: string;
  private readonly recentSelectionsLimit: number;
  private readonly timelineLimit: number;

  constructor(private readonly options: DashboardServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.timeZone = options.timeZone ?? "America/Sao_Paulo";
    this.recentSelectionsLimit = options.recentSelectionsLimit ?? 5;
    this.timelineLimit = options.timelineLimit ?? 6;
  }

  async getSnapshot(input: { userId: number }): Promise<DashboardSnapshot> {
    const now = this.now();
    const { start, end } = getDayBoundsInTimeZone(now, this.timeZone);
    const [
      favorites,
      recentSelections,
      activityTimeline,
      searchesToday,
      viewsToday,
      marketMovers,
    ] = await Promise.all([
      this.options.favoritesReader.listFavorites(input.userId),
      this.options.recentSelectionsReader.listRecentSelections(
        input.userId,
        this.recentSelectionsLimit,
      ),
      this.options.activityEventRepository.listRecentEvents(
        input.userId,
        this.timelineLimit,
      ),
      this.options.activityEventRepository.countEventsByTypeInRange({
        userId: input.userId,
        type: "search_performed",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }),
      this.options.activityEventRepository.countEventsByTypeInRange({
        userId: input.userId,
        type: "asset_viewed",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }),
      this.options.marketMoversProvider.getMarketMovers(now),
    ]);

    return {
      stats: {
        favoritesCount: favorites.length,
        searchesToday,
        viewsToday,
      },
      recentSelections,
      activityTimeline,
      marketMovers,
      generatedAt: now.toISOString(),
    };
  }
}
