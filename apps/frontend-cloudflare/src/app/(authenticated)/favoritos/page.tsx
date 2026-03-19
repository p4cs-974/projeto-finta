import type { FavoriteAsset } from "@finta/favorites";
import { Star } from "lucide-react";
import Link from "next/link";

import { getFavoritesServer } from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";
import { FavoritesFilter } from "@/features/favorites/components/FavoritesFilter";

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
          <FavoritesFilter favorites={favorites} />
        )}
      </div>
    </main>
  );
}
