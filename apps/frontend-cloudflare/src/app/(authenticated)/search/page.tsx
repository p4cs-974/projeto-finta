import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { RecentAssetSelection } from "@finta/user-assets";
import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { SearchControls } from "@/components/search/search-controls";
import {
  formatMoney,
  formatRelativeTime,
  getModeAssetType,
  getQuoteLabel,
  getQuoteLogoUrl,
  getQuoteSymbol,
  getRecentMode,
  isStockQuoteWithCache,
  isValidSearchInput,
  normalizeSearchInput,
  type SearchMode,
} from "@/features/price-query/presentation";
import { AssetDetailsClient } from "@/features/price-query/components/AssetDetailsClient";
import {
  getCachedQuoteServer,
  getLiveQuoteServer,
  getRecentSelectionsServer,
  searchCachedQuotesServer,
} from "@/lib/backend-server";
import { ApiRequestError } from "@/lib/http-client";

interface SearchPageProps {
  searchParams: Promise<{
    mode?: string;
    q?: string;
  }>;
}

function parseMode(mode: string | undefined): SearchMode {
  return mode === "crypto" ? "crypto" : "stocks";
}

function AssetLogo({
  symbol,
  logoUrl,
  className,
}: {
  symbol: string;
  logoUrl: string | null;
  className: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={`${className} object-contain`} />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground`}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

function ErrorState({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <section
      className={`border border-dashed border-border bg-muted/30 p-8 text-center ${className ?? ""}`}
    >
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {body}
      </p>
    </section>
  );
}

function buildSearchHref(mode: SearchMode, query: string) {
  return `/search?mode=${mode}&q=${encodeURIComponent(query)}`;
}

function MatchListItem({ quote }: { quote: QuoteWithCacheMeta }) {
  const symbol = getQuoteSymbol(quote);
  const mode: SearchMode = isStockQuoteWithCache(quote) ? "stocks" : "crypto";
  const logoUrl = getQuoteLogoUrl(quote);

  return (
    <Link
      href={buildSearchHref(mode, symbol)}
      className="group flex w-full items-center gap-3 border border-border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/45"
    >
      <AssetLogo symbol={symbol} logoUrl={logoUrl} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{symbol}</p>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {isStockQuoteWithCache(quote) ? quote.data.market : "cripto"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {getQuoteLabel(quote)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">
          {formatMoney(quote.data.currency, quote.data.price)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(quote.data.quotedAt)}
        </p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function RecentListItem({ item }: { item: RecentAssetSelection }) {
  const mode = getRecentMode(item.assetType);

  return (
    <Link
      href={buildSearchHref(mode, item.symbol)}
      className="flex w-full items-center gap-3 border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <AssetLogo
        symbol={item.symbol}
        logoUrl={item.logoUrl}
        className="size-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.symbol}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {item.label}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {item.assetType}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(item.lastSelectedAt)}
        </p>
      </div>
    </Link>
  );
}

async function SearchListPane({
  mode,
  normalizedQuery,
}: {
  mode: SearchMode;
  normalizedQuery: string;
}) {
  if (normalizedQuery.length === 0) {
    let recents: RecentAssetSelection[];

    try {
      recents = await getRecentSelectionsServer();
    } catch (error) {
      const recentError =
        error instanceof ApiRequestError && error.status === 401
          ? "Sua sessão expirou. Faça login novamente para carregar o histórico recente."
          : "Não foi possível carregar o histórico recente no momento.";

      return (
        <div className="border border-dashed border-rose-500/40 bg-rose-500/8 p-4 text-sm text-rose-700 dark:text-rose-300">
          {recentError}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Recentes
          </p>
        </div>
        {recents.length > 0 ? (
          <ul className="space-y-2">
            {recents.map((item) => (
              <li key={`${item.assetType}:${item.symbol}`}>
                <RecentListItem item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Ainda não há buscas recentes.
          </div>
        )}
      </div>
    );
  }

  let visibleMatches: QuoteWithCacheMeta[];

  try {
    visibleMatches = await searchCachedQuotesServer(
      normalizedQuery,
      getModeAssetType(mode),
    );
  } catch (error) {
    const body =
      error instanceof ApiRequestError && error.status === 401
        ? "Sua sessão expirou. Faça login novamente para consultar ativos."
        : "Não foi possível consultar os ativos em cache no momento.";

    return (
      <ErrorState
        title="Falha ao carregar a lista"
        body={body}
        className="flex flex-1 flex-col items-center justify-center"
      />
    );
  }

  if (visibleMatches.length === 0) {
    return (
      <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Nenhum ativo em cache começa com {normalizedQuery}.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleMatches.map((quote) => (
        <MatchListItem key={`${mode}:${getQuoteSymbol(quote)}`} quote={quote} />
      ))}
    </div>
  );
}

async function SearchDetailsPane({
  mode,
  normalizedQuery,
}: {
  mode: SearchMode;
  normalizedQuery: string;
}) {
  if (normalizedQuery.length === 0) {
    return (
      <ErrorState
        title="Comece por um símbolo exato"
        body="Use o campo ao lado para consultar uma ação da B3 ou um ativo cripto. Quando não houver busca, seus 5 itens recentes ficam disponíveis na coluna esquerda."
        className="flex flex-1 flex-col items-center justify-center"
      />
    );
  }

  if (!isValidSearchInput(normalizedQuery, mode)) {
    return (
      <ErrorState
        title="Entrada parcial ou inválida"
        body={
          mode === "stocks"
            ? "A busca ao vivo só roda para tickers completos no formato ABCD1, ABCD11 ou ABCD11.XX."
            : "A busca ao vivo só roda para símbolos cripto exatos com 2 a 15 caracteres."
        }
        className="flex flex-1 flex-col items-center justify-center"
      />
    );
  }

  let cachedQuote: QuoteWithCacheMeta | null = null;

  try {
    cachedQuote = await getCachedQuoteServer(
      normalizedQuery,
      getModeAssetType(mode),
    );
  } catch (error) {
    if (
      !(error instanceof ApiRequestError) ||
      error.status !== 404 ||
      error.code !== "ASSET_CACHE_MISS"
    ) {
      if (error instanceof ApiRequestError && error.status === 401) {
        return (
          <ErrorState
            title="Sessão expirada"
            body="Sua sessão não é mais válida. Faça login novamente para continuar."
            className="flex flex-1 flex-col items-center justify-center"
          />
        );
      }

      if (error instanceof ApiRequestError && error.status === 502) {
        return (
          <ErrorState
            title="Serviço indisponível"
            body="O provedor de cotações está indisponível no momento. Tente novamente em instantes."
            className="flex flex-1 flex-col items-center justify-center"
          />
        );
      }

      throw error;
    }
  }

  const shouldFetchLive = !cachedQuote || cachedQuote.cache.stale;

  if (!shouldFetchLive && cachedQuote) {
    return (
      <AssetDetailsClient
        symbol={normalizedQuery}
        assetType={getModeAssetType(mode)}
        initialQuote={cachedQuote}
      />
    );
  }

  let liveQuote: QuoteWithCacheMeta;

  try {
    liveQuote = await getLiveQuoteServer(
      normalizedQuery,
      getModeAssetType(mode),
    );
  } catch (error) {
    if (cachedQuote) {
      return (
        <AssetDetailsClient
          symbol={normalizedQuery}
          assetType={getModeAssetType(mode)}
          initialQuote={cachedQuote}
        />
      );
    }

    if (error instanceof ApiRequestError && error.status === 404) {
      return (
        <ErrorState
          title="Ativo não encontrado"
          body={`Nenhuma cotação exata foi encontrada para ${normalizedQuery}.`}
          className="flex flex-1 flex-col items-center justify-center"
        />
      );
    }

    if (error instanceof ApiRequestError && error.status === 422) {
      return (
        <ErrorState
          title="Entrada inválida"
          body="Revise o símbolo informado. A validação do backend rejeitou a consulta."
          className="flex flex-1 flex-col items-center justify-center"
        />
      );
    }

    if (error instanceof ApiRequestError && error.status === 401) {
      return (
        <ErrorState
          title="Sessão expirada"
          body="Sua sessão não é mais válida. Faça login novamente para continuar."
          className="flex flex-1 flex-col items-center justify-center"
        />
      );
    }

    if (error instanceof ApiRequestError && error.status === 502) {
      return (
        <ErrorState
          title="Serviço indisponível"
          body="O provedor de cotações está indisponível no momento. Tente novamente em instantes."
          className="flex flex-1 flex-col items-center justify-center"
        />
      );
    }

    throw error;
  }

  return (
    <AssetDetailsClient
      symbol={normalizedQuery}
      assetType={getModeAssetType(mode)}
      initialQuote={liveQuote}
    />
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialMode = parseMode(params.mode);
  const initialQuery = normalizeSearchInput(params.q ?? "");

  return (
    <main className="flex min-h-0 flex-1 px-4 pb-4 md:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <section className="grid min-h-0 flex-1 border border-border bg-card lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
          <aside className="flex min-h-0 flex-col border-b border-border p-5 lg:border-r lg:border-b-0 lg:p-7">
            <div className="flex min-h-0 flex-1 flex-col gap-5">
              <SearchControls
                initialMode={initialMode}
                initialQuery={initialQuery}
              />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Suspense
                  fallback={
                    <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Carregando resultados...
                    </div>
                  }
                >
                  <SearchListPane
                    mode={initialMode}
                    normalizedQuery={initialQuery}
                  />
                </Suspense>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col bg-background/60 p-5 lg:p-7">
            <div className="flex min-h-0 flex-1 flex-col">
              <Suspense
                fallback={
                  <ErrorState
                    title="Buscando ativo"
                    body={
                      initialQuery
                        ? `A consulta exata para ${initialQuery} está em andamento.`
                        : "Preparando a visualização do ativo."
                    }
                    className="flex flex-1 flex-col items-center justify-center"
                  />
                }
              >
                <SearchDetailsPane
                  mode={initialMode}
                  normalizedQuery={initialQuery}
                />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
