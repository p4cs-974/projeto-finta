"use client";

import type { AssetType } from "@finta/shared-kernel";
import { Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addFavorite } from "@/features/user-assets/api";

interface FavoriteButtonProps {
  symbol: string;
  assetType: AssetType;
}

type Status = "idle" | "loading" | "done" | "error";

export function FavoriteButton({ symbol, assetType }: FavoriteButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      await addFavorite({ symbol, assetType });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="size-3.5 fill-current" />
        Favoritado
      </Button>
    );
  }

  if (status === "error") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="border-rose-500/30 text-rose-700 dark:text-rose-300"
      >
        <Star className="size-3.5" />
        Tentar novamente
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={status === "loading"}
    >
      <Star className="size-3.5" />
      {status === "loading" ? "Favoritando..." : "Favoritar"}
    </Button>
  );
}
