import { describe, expect, it } from "vitest";

import { sortFavorites, type SortableFavorite } from "./sort";

function fav(symbol: string, type: "stock" | "crypto"): SortableFavorite {
  return { symbol, type };
}

describe("sortFavorites", () => {
  it("returns an empty array for an empty input", () => {
    expect(sortFavorites([])).toEqual([]);
  });

  it("sorts distinct symbols lexicographically", () => {
    const result = sortFavorites([
      fav("PETR4", "stock"),
      fav("AAPL", "stock"),
      fav("BTC", "crypto"),
    ]);

    expect(result.map((item) => item.symbol)).toEqual(["AAPL", "BTC", "PETR4"]);
  });

  it("breaks ties between identical symbols by assetType (crypto before stock)", () => {
    const result = sortFavorites([
      fav("BTC", "stock"),
      fav("BTC", "crypto"),
    ]);

    expect(result).toEqual([fav("BTC", "crypto"), fav("BTC", "stock")]);
  });

  it("is idempotent: sorting an already-sorted list returns equivalent order", () => {
    const sorted = sortFavorites([fav("AAPL", "stock"), fav("BTC", "crypto")]);

    expect(sortFavorites(sorted)).toEqual(sorted);
  });

  it("does not mutate the input array", () => {
    const input = [fav("ZZZ", "stock"), fav("AAA", "stock")];
    const snapshot = [...input];

    sortFavorites(input);

    expect(input).toEqual(snapshot);
  });
});
