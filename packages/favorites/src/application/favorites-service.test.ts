import { describe, expect, it } from "vitest";

import type { FavoriteAsset } from "../contracts/favorites";
import type { IFavoriteAssetRepository } from "../ports";

import { FavoritesService } from "./favorites-service";

class InMemoryFavoriteAssetRepository implements IFavoriteAssetRepository {
  readonly listFavoritesCalls: number[] = [];

  constructor(private readonly items: FavoriteAsset[]) {}

  async listFavorites(userId: number): Promise<FavoriteAsset[]> {
    this.listFavoritesCalls.push(userId);
    return this.items;
  }
}

function createFavoriteAsset(
  symbol: string,
  favoritedAt: string,
): FavoriteAsset {
  return {
    symbol,
    assetType: "stock",
    label: `Asset ${symbol}`,
    market: "B3",
    currency: "BRL",
    logoUrl: `https://example.com/${symbol.toLowerCase()}.png`,
    favoritedAt,
  };
}

describe("FavoritesService", () => {
  it("calls the repository with the provided userId", async () => {
    const repository = new InMemoryFavoriteAssetRepository([]);
    const service = new FavoritesService({
      favoriteAssetRepository: repository,
    });

    await service.listFavorites({ userId: 42 });

    expect(repository.listFavoritesCalls).toEqual([42]);
  });

  it("returns the repository list without changing shape or order", async () => {
    const favorites = [
      createFavoriteAsset("PETR4", "2026-03-18T12:01:00.000Z"),
      createFavoriteAsset("VALE3", "2026-03-18T12:00:00.000Z"),
    ];
    const service = new FavoritesService({
      favoriteAssetRepository: new InMemoryFavoriteAssetRepository(favorites),
    });

    await expect(service.listFavorites({ userId: 1 })).resolves.toEqual(
      favorites,
    );
  });
});
