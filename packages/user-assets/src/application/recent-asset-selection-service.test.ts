import { describe, expect, it } from "vitest";

import type {
  RecentAssetSelection,
  TrackedAssetRef,
} from "../contracts/assets";
import type { IUserAssetRepository } from "../ports";

import { RecentAssetSelectionService } from "./recent-asset-selection-service";

class InMemoryUserAssetRepository implements IUserAssetRepository {
  private nextId = 1;
  private readonly items = new Map<
    number,
    RecentAssetSelection & { id: number; userId: number }
  >();

  async listRecentSelections(userId: number, limit: number) {
    return [...this.items.values()]
      .filter((item) => item.userId === userId)
      .sort(
        (left, right) =>
          Date.parse(right.lastSelectedAt) - Date.parse(left.lastSelectedAt),
      )
      .slice(0, limit)
      .map(({ id: _id, userId: _userId, ...item }) => item);
  }

  async upsertRecentSelection(input: {
    userId: number;
    asset: TrackedAssetRef;
    selectedAt: Date;
  }) {
    const existing = [...this.items.values()].find(
      (item) =>
        item.userId === input.userId &&
        item.symbol === input.asset.symbol &&
        item.assetType === input.asset.assetType,
    );

    if (existing) {
      this.items.set(existing.id, {
        ...existing,
        ...input.asset,
        lastSelectedAt: input.selectedAt.toISOString(),
      });
      return;
    }

    const id = this.nextId;
    this.nextId += 1;
    this.items.set(id, {
      id,
      userId: input.userId,
      ...input.asset,
      lastSelectedAt: input.selectedAt.toISOString(),
    });
  }

  async trimRecentSelections(userId: number, keep: number) {
    const overflow = [...this.items.values()]
      .filter((item) => item.userId === userId)
      .sort(
        (left, right) =>
          Date.parse(right.lastSelectedAt) - Date.parse(left.lastSelectedAt),
      )
      .slice(keep);

    for (const item of overflow) {
      this.items.delete(item.id);
    }
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

describe("RecentAssetSelectionService", () => {
  it("records a recent selection with upsert semantics", async () => {
    const service = new RecentAssetSelectionService({
      userAssetRepository: new InMemoryUserAssetRepository(),
      now: () => new Date("2026-03-11T12:00:00.000Z"),
    });

    await service.recordSelection({
      userId: 1,
      asset: createTrackedAssetRef("PETR4"),
    });

    await expect(
      service.listRecentSelections({ userId: 1, limit: 5 }),
    ).resolves.toHaveLength(1);
  });

  it("updates an existing selection without creating duplicates", async () => {
    const userAssetRepository = new InMemoryUserAssetRepository();
    const service = new RecentAssetSelectionService({
      userAssetRepository,
      now: (() => {
        const dates = [
          new Date("2026-03-11T12:00:00.000Z"),
          new Date("2026-03-11T12:05:00.000Z"),
        ];
        let index = 0;
        return () => dates[index++] ?? dates[dates.length - 1]!;
      })(),
    });

    await service.recordSelection({
      userId: 1,
      asset: createTrackedAssetRef("PETR4"),
    });
    await service.recordSelection({
      userId: 1,
      asset: {
        ...createTrackedAssetRef("PETR4"),
        label: "Petrobras PN",
      },
    });

    const items = await service.listRecentSelections({ userId: 1, limit: 5 });

    expect(items).toHaveLength(1);
    expect(items[0]?.label).toBe("Petrobras PN");
    expect(items[0]?.lastSelectedAt).toBe("2026-03-11T12:05:00.000Z");
  });

  it("lists recent selections ordered by descending date", async () => {
    const userAssetRepository = new InMemoryUserAssetRepository();
    const service = new RecentAssetSelectionService({
      userAssetRepository,
      now: (() => {
        const dates = [
          new Date("2026-03-11T12:00:00.000Z"),
          new Date("2026-03-11T12:01:00.000Z"),
        ];
        let index = 0;
        return () => dates[index++] ?? dates[dates.length - 1]!;
      })(),
    });

    await service.recordSelection({
      userId: 1,
      asset: createTrackedAssetRef("PETR4"),
    });
    await service.recordSelection({
      userId: 1,
      asset: createTrackedAssetRef("BTC", "crypto"),
    });

    const items = await service.listRecentSelections({ userId: 1, limit: 5 });

    expect(items.map((item) => item.symbol)).toEqual(["BTC", "PETR4"]);
  });

  it("trims the list to the five most recent items", async () => {
    const userAssetRepository = new InMemoryUserAssetRepository();
    let minute = 0;
    const service = new RecentAssetSelectionService({
      userAssetRepository,
      now: () => new Date(`2026-03-11T12:0${minute++}:00.000Z`),
      keep: 5,
    });

    for (const symbol of ["PETR4", "VALE3", "ABEV3", "ITUB4", "BBAS3", "BTC"]) {
      await service.recordSelection({
        userId: 1,
        asset: createTrackedAssetRef(
          symbol,
          symbol === "BTC" ? "crypto" : "stock",
        ),
      });
    }

    const items = await service.listRecentSelections({ userId: 1, limit: 10 });

    expect(items).toHaveLength(5);
    expect(items.map((item) => item.symbol)).toEqual([
      "BTC",
      "BBAS3",
      "ITUB4",
      "ABEV3",
      "VALE3",
    ]);
  });
});
