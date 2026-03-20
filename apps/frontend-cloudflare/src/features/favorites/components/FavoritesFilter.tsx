"use client";

import type { FavoriteAsset } from "@finta/favorites";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { removeFavorite } from "@/features/user-assets/api";
import { FavoriteItem } from "@/features/favorites/components/FavoriteItem";

type Filter = "all" | "stock" | "crypto";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "stock", label: "Ações" },
  { value: "crypto", label: "Criptos" },
];

function countByType(favorites: FavoriteAsset[], type: Filter): number {
  if (type === "all") return favorites.length;
  return favorites.filter((f) => f.assetType === type).length;
}

interface FavoritesFilterProps {
  favorites: FavoriteAsset[];
}

export function FavoritesFilter({ favorites: initialFavorites }: FavoritesFilterProps) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [filter, setFilter] = useState<Filter>("all");
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? favorites
      : favorites.filter((f) => f.assetType === filter);

  async function handleRemove(item: FavoriteAsset) {
    const key = `${item.assetType}:${item.symbol}`;
    setRemovingKey(key);
    try {
      await removeFavorite({ symbol: item.symbol, assetType: item.assetType });
      setFavorites((prev) =>
        prev.filter(
          (f) => !(f.symbol === item.symbol && f.assetType === item.assetType),
        ),
      );
    } catch {
      // Keep item in list on failure
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {FILTER_OPTIONS.map((option) => {
          const count = countByType(favorites, option.value);
          const isActive = filter === option.value;

          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value)}
            >
              {option.label} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum favorito nesta categoria.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const key = `${item.assetType}:${item.symbol}`;
            return (
              <FavoriteItem
                key={key}
                item={item}
                onRemove={handleRemove}
                removing={removingKey === key}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
