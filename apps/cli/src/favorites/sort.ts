import type { AssetTypeLiteral } from "../headless/asset-type";

export interface SortableFavorite {
  symbol: string;
  type: AssetTypeLiteral;
}

export function sortFavorites<T extends SortableFavorite>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const bySymbol = a.symbol.localeCompare(b.symbol);
    if (bySymbol !== 0) {
      return bySymbol;
    }
    return a.type.localeCompare(b.type);
  });
}
