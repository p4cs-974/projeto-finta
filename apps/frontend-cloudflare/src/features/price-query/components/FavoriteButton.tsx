"use client";

import type { AssetType } from "@finta/shared-kernel";
import { Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addFavorite, removeFavorite } from "@/features/user-assets/api";

interface FavoriteButtonProps {
  symbol: string;
  assetType: AssetType;
  initialFavorited?: boolean;
}

type Status = "idle" | "loading" | "error";

export function FavoriteButton({
  symbol,
  assetType,
  initialFavorited = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [status, setStatus] = useState<Status>("idle");

  async function handleToggle() {
    setStatus("loading");
    try {
      if (favorited) {
        await removeFavorite({ symbol, assetType });
        setFavorited(false);
      } else {
        await addFavorite({ symbol, assetType });
        setFavorited(true);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (status === "error") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="border-rose-500/30 text-rose-700 dark:text-rose-300"
      >
        <Star className="size-3.5" />
        Tentar novamente
      </Button>
    );
  }

  if (favorited) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={status === "loading"}
        className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      >
        <Star className="size-3.5 fill-current" />
        {status === "loading" ? "Removendo..." : "Favoritado"}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={status === "loading"}
    >
      <Star className="size-3.5" />
      {status === "loading" ? "Favoritando..." : "Favoritar"}
    </Button>
  );
}
