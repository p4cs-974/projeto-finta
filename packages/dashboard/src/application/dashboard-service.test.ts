import { describe, expect, it } from "vitest";
import type { FavoriteAsset } from "@finta/favorites";
import type { RecentAssetSelection } from "@finta/user-assets";

import type {
  IDashboardActivityEventRepository,
  IDashboardFavoritesReader,
  IDashboardMarketMoversProvider,
  IDashboardRecentSelectionsReader,
} from "../ports";
import type { DashboardActivityEvent, DashboardMarketMovers } from "../contracts/dashboard";

import { DashboardService } from "./dashboard-service";

class InMemoryFavoritesReader implements IDashboardFavoritesReader {
  constructor(private readonly items: FavoriteAsset[]) {}

  listFavorites() {
    return Promise.resolve(this.items);
  }
}

class InMemoryRecentSelectionsReader implements IDashboardRecentSelectionsReader {
  constructor(private readonly items: RecentAssetSelection[]) {}

  listRecentSelections(_userId: number, limit: number) {
    return Promise.resolve(this.items.slice(0, limit));
  }
}

class InMemoryDashboardActivityEventRepository
  implements IDashboardActivityEventRepository
{
  constructor(private readonly items: DashboardActivityEvent[]) {}

  async listRecentEvents(_userId: number, limit: number) {
    return this.items.slice(0, limit);
  }

  async countEventsByTypeInRange(input: {
    type: DashboardActivityEvent["type"];
    startAt: string;
    endAt: string;
  }) {
    return this.items.filter(
      (item) =>
        item.type === input.type &&
        item.createdAt >= input.startAt &&
        item.createdAt < input.endAt,
    ).length;
  }

  async createEvent() {}
}

class InMemoryMarketMoversProvider implements IDashboardMarketMoversProvider {
  constructor(private readonly marketMovers: DashboardMarketMovers) {}

  getMarketMovers() {
    return Promise.resolve(this.marketMovers);
  }
}

describe("DashboardService", () => {
  it("aggregates a dashboard snapshot from component ports", async () => {
    const service = new DashboardService({
      favoritesReader: new InMemoryFavoritesReader([
        {
          symbol: "PETR4",
          assetType: "stock",
          label: "Petrobras PN",
          market: "B3",
          currency: "BRL",
          logoUrl: null,
          favoritedAt: "2026-03-20T14:35:00.000Z",
        },
      ]),
      recentSelectionsReader: new InMemoryRecentSelectionsReader([
        {
          symbol: "BTC",
          assetType: "crypto",
          label: "Bitcoin",
          market: null,
          currency: "USD",
          logoUrl: null,
          lastSelectedAt: "2026-03-20T14:45:00.000Z",
        },
      ]),
      activityEventRepository: new InMemoryDashboardActivityEventRepository([
        {
          type: "favorite_added",
          symbol: "PETR4",
          assetType: "stock",
          label: "Petrobras PN",
          searchQuery: null,
          createdAt: "2026-03-20T14:35:00.000Z",
        },
        {
          type: "asset_viewed",
          symbol: "BTC",
          assetType: "crypto",
          label: "Bitcoin",
          searchQuery: null,
          createdAt: "2026-03-20T14:30:00.000Z",
        },
        {
          type: "search_performed",
          symbol: null,
          assetType: "crypto",
          label: null,
          searchQuery: "BTC",
          createdAt: "2026-03-20T14:00:00.000Z",
        },
      ]),
      marketMoversProvider: new InMemoryMarketMoversProvider({
        gainers: [],
        losers: [],
      }),
      now: () => new Date("2026-03-20T15:00:00.000Z"),
    });

    const snapshot = await service.getSnapshot({ userId: 1 });

    expect(snapshot.stats).toEqual({
      favoritesCount: 1,
      searchesToday: 1,
      viewsToday: 1,
    });
    expect(snapshot.recentSelections).toHaveLength(1);
    expect(snapshot.activityTimeline[0]?.type).toBe("favorite_added");
    expect(snapshot.generatedAt).toBe("2026-03-20T15:00:00.000Z");
  });
});
