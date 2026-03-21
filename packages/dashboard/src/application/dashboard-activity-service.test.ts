import { describe, expect, it, vi } from "vitest";
import type { TrackedAssetRef } from "@finta/user-assets";

import type { IDashboardActivityEventRepository } from "../ports";

import { DashboardActivityService } from "./dashboard-activity-service";

class InMemoryDashboardActivityEventRepository
  implements IDashboardActivityEventRepository
{
  readonly events: Array<Parameters<IDashboardActivityEventRepository["createEvent"]>[0]> =
    [];

  async listRecentEvents() {
    return [];
  }

  async countEventsByTypeInRange() {
    return 0;
  }

  async createEvent(
    input: Parameters<IDashboardActivityEventRepository["createEvent"]>[0],
  ) {
    this.events.push(input);
  }
}

function createTrackedAssetRef(
  symbol: string,
  assetType: TrackedAssetRef["assetType"] = "stock",
): TrackedAssetRef {
  return {
    symbol,
    assetType,
    label: `Asset ${symbol}`,
    market: assetType === "stock" ? "B3" : null,
    currency: assetType === "stock" ? "BRL" : "USD",
    logoUrl: null,
  };
}

describe("DashboardActivityService", () => {
  it("records normalized search events", async () => {
    const repository = new InMemoryDashboardActivityEventRepository();
    const service = new DashboardActivityService({
      activityEventRepository: repository,
      now: () => new Date("2026-03-20T15:00:00.000Z"),
    });

    await service.recordSearch({
      userId: 1,
      query: " petr ",
      assetType: "stock",
    });

    expect(repository.events).toEqual([
      expect.objectContaining({
        userId: 1,
        type: "search_performed",
        assetType: "stock",
        searchQuery: "PETR",
        createdAt: new Date("2026-03-20T15:00:00.000Z"),
      }),
    ]);
  });

  it("records asset-scoped events with shared metadata", async () => {
    const repository = new InMemoryDashboardActivityEventRepository();
    const now = vi.fn(() => new Date("2026-03-20T15:00:00.000Z"));
    const service = new DashboardActivityService({
      activityEventRepository: repository,
      now,
    });
    const asset = createTrackedAssetRef("BTC", "crypto");

    await service.recordAssetView({ userId: 1, asset });
    await service.recordFavoriteAdded({ userId: 1, asset });
    await service.recordFavoriteRemoved({ userId: 1, asset });

    expect(repository.events.map((event) => event.type)).toEqual([
      "asset_viewed",
      "favorite_added",
      "favorite_removed",
    ]);
    expect(repository.events.every((event) => event.symbol === "BTC")).toBe(
      true,
    );
    expect(repository.events.every((event) => event.label === "Asset BTC")).toBe(
      true,
    );
  });
});
