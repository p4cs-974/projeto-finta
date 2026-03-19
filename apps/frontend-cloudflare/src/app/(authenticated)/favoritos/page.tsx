import type { FavoriteAsset } from "@finta/favorites";
import { Star } from "lucide-react";
import Link from "next/link";

import { getFavoritesServer } from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";

function buildSearchHref(assetType: "stock" | "crypto", symbol: string) {
  const mode = assetType === "stock" ? "stocks" : "crypto";
  return `/search?mode=${mode}&q=${encodeURIComponent(symbol)}`;
}

function AssetLogo({
  symbol,
  logoUrl,
}: {
  symbol: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className="size-10 object-contain" />;
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground">
      {symbol.slice(0, 3)}
    </div>
  );
}

function FavoriteItem({ item }: { item: FavoriteAsset }) {
  return (
    <li>
      <Link
        href={buildSearchHref(item.assetType, item.symbol)}
        className="group flex items-center gap-4 border border-border bg-background px-4 py-4 transition-colors hover:bg-muted/45"
      >
        <AssetLogo symbol={item.symbol} logoUrl={item.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {item.symbol}
            </p>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {item.assetType === "stock" ? item.market : "cripto"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.label}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.currency}
        </span>
      </Link>
    </li>
  );
}

export default async function FavoritosPage() {
  let favorites: FavoriteAsset[];

  try {
    favorites = await getFavoritesServer();
  } catch (error) {
    const body =
      error instanceof ApiRequestError && error.status === 401
        ? "Sua sessão expirou. Faça login novamente para ver seus favoritos."
        : "Não foi possível carregar seus favoritos no momento.";

    return (
      <main className="flex flex-1 px-4 pb-4 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Favoritos
            </h1>
          </div>
          <div className="border border-dashed border-rose-500/40 bg-rose-500/8 p-6 text-sm text-rose-700 dark:text-rose-300">
            {body}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 px-4 pb-4 md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Star className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Favoritos
          </h1>
          {favorites.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({favorites.length})
            </span>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum favorito ainda.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Busque um ativo e clique em{" "}
              <span className="font-medium">Favoritar</span> para adicioná-lo
              aqui.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-flex items-center gap-2 border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Ir para busca
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {favorites.map((item) => (
              <FavoriteItem
                key={`${item.assetType}:${item.symbol}`}
                item={item}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
