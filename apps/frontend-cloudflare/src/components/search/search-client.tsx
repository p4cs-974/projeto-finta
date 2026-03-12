"use client";

import type { QuoteWithCacheMeta as QuoteResponse } from "@finta/price-query";
import type { RecentAssetSelection, TrackedAssetRef } from "@finta/user-assets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bitcoin,
  Clock3,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { startTransition, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import {
  getCachedQuote,
  getLiveQuote,
  searchCachedQuotes,
} from "@/features/price-query/api";
import {
  formatMoney,
  formatRelativeTime,
  getModeAssetType,
  getQuoteLabel,
  getQuoteLogoUrl,
  getQuoteSymbol,
  getRecentMode,
  isStockQuoteWithCache as isStockQuoteResponse,
  isValidSearchInput,
  normalizeSearchInput,
  type SearchMode,
} from "@/features/price-query/presentation";
import {
  listRecentSelections,
  recordRecentSelection,
} from "@/features/user-assets/api";
import { ApiRequestError } from "@/lib/http-client";

interface SearchClientProps {
  initialMode: SearchMode;
  initialQuery: string;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debounced;
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
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

function StatusPanel({
  query,
  mode,
  hasMatches,
  cacheState,
  liveState,
}: {
  query: string;
  mode: SearchMode;
  hasMatches: boolean;
  cacheState: {
    data: QuoteResponse | null | undefined;
    error: Error | null;
  };
  liveState: {
    isFetching: boolean;
  };
}) {
  const normalized = normalizeSearchInput(query);

  if (!normalized) {
    return null;
  }

  let title = "Validando entrada";
  let description =
    mode === "stocks"
      ? "Digite um ticker exato, como PETR4 ou AAPL34.SA."
      : "Digite um símbolo exato de cripto, como BTC.";

  if (cacheState.data) {
    title = "Encontrado em cache";
    description = `Há uma cotação em cache para ${normalized}.`;
  } else if (hasMatches) {
    title = "Partial matches";
    description = `Encontramos ativos em cache começando com ${normalized}.`;
  } else if (cacheState.error instanceof ApiRequestError) {
    if (cacheState.error.status === 404) {
      title = "Looking for it";
      description = `O ativo ${normalized} ainda não está no cache local.`;
    } else if (cacheState.error.status === 401) {
      title = "Sessão inválida";
      description = "Faça login novamente para consultar ativos.";
    }
  } else if (liveState.isFetching) {
    title = "Looking for it";
    description = `Buscando cotação exata para ${normalized}.`;
  } else if (isValidSearchInput(normalized, mode)) {
    title = "Pronto para consultar";
    description = `A busca exata para ${normalized} será feita após 500ms sem digitação.`;
  }

  return (
    <div className="border border-dashed border-border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        Lookup
      </p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MatchListItem({
  quote,
  selected,
  onSelect,
}: {
  quote: QuoteResponse;
  selected: boolean;
  onSelect: () => void;
}) {
  const logoUrl = getQuoteLogoUrl(quote);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors ${
        selected
          ? "border-primary/40 bg-primary/8"
          : "border-border bg-background hover:bg-muted/45"
      }`}
    >
      <AssetLogo
        symbol={getQuoteSymbol(quote)}
        logoUrl={logoUrl}
        className="size-10"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {getQuoteSymbol(quote)}
          </p>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {isStockQuoteResponse(quote) ? quote.data.market : "crypto"}
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
    </button>
  );
}

function AssetDetails({
  quote,
  title,
  badge,
  className,
}: {
  quote: QuoteResponse;
  title: string;
  badge: string;
  className?: string;
}) {
  const isStock = isStockQuoteResponse(quote);
  const delta = quote.data.change;
  const positive = delta >= 0;
  const symbol = getQuoteSymbol(quote);
  const logoUrl = getQuoteLogoUrl(quote);

  return (
    <section
      className={`relative overflow-hidden border border-border bg-card p-6 md:p-8 ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(11,112,87,0.12),transparent_42%)]" />
      <div className="relative flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AssetLogo symbol={symbol} logoUrl={logoUrl} className="size-14" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                {title}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {symbol}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {getQuoteLabel(quote)}
              </p>
            </div>
          </div>
          <span className="border border-border bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {badge}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Preço</p>
            <p className="text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(quote.data.currency, quote.data.price)}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 border px-3 py-2 text-sm font-medium ${
              positive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            }`}
          >
            {positive ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            <span>
              {formatMoney(quote.data.currency, delta)} (
              {quote.data.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <StatChip label="Moeda" value={quote.data.currency} />
          <StatChip
            label={isStock ? "Mercado" : "Categoria"}
            value={isStock ? quote.data.market : "Crypto"}
          />
          <StatChip
            label="Cotado"
            value={formatRelativeTime(quote.data.quotedAt)}
          />
          <StatChip
            label="Cache"
            value={formatRelativeTime(quote.cache.updatedAt)}
          />
        </div>
      </div>
    </section>
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

export function SearchClient({ initialMode, initialQuery }: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalizeSearchInput(query);
  const debouncedQuery = useDebouncedValue(normalizedQuery, 500);
  const persistedLiveKeyRef = useRef<string | null>(null);

  function replaceUrl(nextMode: SearchMode, nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("mode", nextMode);

    if (nextQuery.trim()) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    const next = params.toString();

    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    });
  }

  const recentMutation = useMutation({
    mutationFn: (selection: TrackedAssetRef) =>
      recordRecentSelection(selection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-assets"] });
    },
  });

  const recentsQuery = useQuery({
    queryKey: ["recent-assets"],
    enabled: normalizedQuery.length === 0,
    queryFn: () => listRecentSelections(),
  });

  const cachedMatchesQuery = useQuery({
    queryKey: ["asset-cache-search", mode, normalizedQuery],
    enabled: normalizedQuery.length > 0,
    queryFn: () => searchCachedQuotes(normalizedQuery, getModeAssetType(mode)),
  });

  const cacheProbeQuery = useQuery<QuoteResponse | null>({
    queryKey: ["asset-cache-probe", mode, normalizedQuery],
    enabled:
      normalizedQuery.length > 0 && isValidSearchInput(normalizedQuery, mode),
    queryFn: async () => {
      try {
        return await getCachedQuote(normalizedQuery, getModeAssetType(mode));
      } catch (error) {
        if (
          error instanceof ApiRequestError &&
          error.status === 404 &&
          error.code === "ASSET_CACHE_MISS"
        ) {
          return null;
        }

        throw error;
      }
    },
  });

  const liveQuoteQuery = useQuery({
    queryKey: ["asset-live-quote", mode, debouncedQuery],
    enabled:
      debouncedQuery.length > 0 && isValidSearchInput(debouncedQuery, mode),
    queryFn: () => getLiveQuote(debouncedQuery, getModeAssetType(mode)),
  });

  useEffect(() => {
    if (!liveQuoteQuery.data) {
      return;
    }

    const persistenceKey = `${mode}:${getQuoteSymbol(liveQuoteQuery.data)}`;

    if (persistedLiveKeyRef.current === persistenceKey) {
      return;
    }

    persistedLiveKeyRef.current = persistenceKey;
    recentMutation.mutate({
      symbol: getQuoteSymbol(liveQuoteQuery.data),
      assetType: getModeAssetType(mode),
      label: getQuoteLabel(liveQuoteQuery.data),
      market: isStockQuoteResponse(liveQuoteQuery.data)
        ? liveQuoteQuery.data.data.market
        : null,
      currency: liveQuoteQuery.data.data.currency,
      logoUrl: getQuoteLogoUrl(liveQuoteQuery.data),
    });
  }, [liveQuoteQuery.data, mode, recentMutation]);

  const displayQuote = liveQuoteQuery.data ?? cacheProbeQuery.data ?? null;
  const visibleMatches = cachedMatchesQuery.data ?? [];

  function handleModeChange(nextMode: SearchMode) {
    setMode(nextMode);
    replaceUrl(nextMode, query);
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    replaceUrl(mode, nextQuery);
  }

  function handleRecentClick(selection: RecentAssetSelection) {
    const nextMode = getRecentMode(selection.assetType);

    setMode(nextMode);
    setQuery(selection.symbol);
    replaceUrl(nextMode, selection.symbol);
    recentMutation.mutate({
      symbol: selection.symbol,
      assetType: selection.assetType,
      label: selection.label,
      market: selection.market,
      currency: selection.currency,
      logoUrl: selection.logoUrl,
    });
  }

  function handleCachedMatchClick(quote: QuoteResponse) {
    const nextMode: SearchMode = isStockQuoteResponse(quote)
      ? "stocks"
      : "crypto";
    const nextQuery = getQuoteSymbol(quote);

    setMode(nextMode);
    setQuery(nextQuery);
    replaceUrl(nextMode, nextQuery);
    recentMutation.mutate({
      symbol: nextQuery,
      assetType: getModeAssetType(nextMode),
      label: getQuoteLabel(quote),
      market: isStockQuoteResponse(quote) ? quote.data.market : null,
      currency: quote.data.currency,
      logoUrl: getQuoteLogoUrl(quote),
    });
  }

  const liveError =
    liveQuoteQuery.error instanceof ApiRequestError
      ? liveQuoteQuery.error
      : null;
  const recentError =
    recentsQuery.error instanceof ApiRequestError ? recentsQuery.error : null;
  const showValidationHelp =
    normalizedQuery.length > 0 && !isValidSearchInput(normalizedQuery, mode);

  return (
    <main className="flex min-h-0 flex-1 px-4 pb-4 md:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <section className="grid min-h-0 flex-1 border border-border bg-card lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
          <aside className="flex min-h-0 flex-col border-b border-border p-5 lg:border-r lg:border-b-0 lg:p-7">
            <div className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="border border-border bg-background p-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) =>
                        handleQueryChange(event.target.value)
                      }
                      aria-label="Search"
                      name="instrument-search"
                      autoComplete="off"
                      placeholder={
                        mode === "stocks"
                          ? "Digite um ticker exato, ex: PETR4 ou AAPL34.SA"
                          : "Digite um símbolo exato, ex: BTC"
                      }
                      className="h-11 border-0 bg-transparent pl-9 text-base tracking-wide shadow-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>
                  <div
                    role="group"
                    aria-label="Toggle between stocks and crypto"
                    className="relative flex h-10 items-center gap-1 border border-border p-1"
                  >
                    <motion.div
                      layoutId="active-bg"
                      className="absolute inset-y-1 bg-primary"
                      style={{
                        left: mode === "stocks" ? 4 : "calc(100% - 4px - 4rem)",
                        right:
                          mode === "stocks" ? "calc(100% - 4px - 4rem)" : 4,
                        width: "4rem",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleModeChange("stocks")}
                      className={`relative z-10 flex h-7 w-16 items-center justify-center px-3 text-sm font-medium transition-colors ${
                        mode === "stocks"
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode === "stocks" ? (
                        "Stocks"
                      ) : (
                        <TrendingUp className="size-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange("crypto")}
                      className={`relative z-10 flex h-7 w-16 items-center justify-center px-3 text-sm font-medium transition-colors ${
                        mode === "crypto"
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode === "crypto" ? (
                        "Crypto"
                      ) : (
                        <Bitcoin className="size-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {normalizedQuery.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 text-muted-foreground" />
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Recent
                      </p>
                    </div>
                    {recentsQuery.data && recentsQuery.data.length > 0 ? (
                      <ul className="space-y-2">
                        {recentsQuery.data.map((item) => (
                          <li key={`${item.assetType}:${item.symbol}`}>
                            <button
                              type="button"
                              onClick={() => handleRecentClick(item)}
                              className="flex w-full items-center gap-3 border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <AssetLogo
                                symbol={item.symbol}
                                logoUrl={item.logoUrl}
                                className="size-10 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {item.symbol}
                                </p>
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
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : recentsQuery.isLoading ? (
                      <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Carregando histórico recente...
                      </div>
                    ) : recentsQuery.error ? (
                      <div className="border border-dashed border-rose-500/40 bg-rose-500/8 p-4 text-sm text-rose-700 dark:text-rose-300">
                        {recentError?.status === 401
                          ? "Sua sessão expirou. Faça login novamente para carregar o histórico recente."
                          : "Não foi possível carregar o histórico recente no momento."}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        No recent searches yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/*<StatusPanel
                      query={query}
                      mode={mode}
                      hasMatches={visibleMatches.length > 0}
                      cacheState={cacheProbeQuery}
                      liveState={liveQuoteQuery}
                    />*/}
                    {visibleMatches.length > 0 ? (
                      <div className="space-y-2">
                        {visibleMatches.map((quote) => (
                          <MatchListItem
                            key={`${mode}:${getQuoteSymbol(quote)}`}
                            quote={quote}
                            selected={getQuoteSymbol(quote) === normalizedQuery}
                            onSelect={() => handleCachedMatchClick(quote)}
                          />
                        ))}
                      </div>
                    ) : cachedMatchesQuery.isFetching ? (
                      <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Procurando ativos em cache...
                      </div>
                    ) : (
                      <div className="border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Nenhum ativo em cache começa com {normalizedQuery}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col bg-background/60 p-5 lg:p-7">
            <div className="flex min-h-0 flex-1 flex-col">
              {normalizedQuery.length === 0 ? (
                <ErrorState
                  title="Comece por um símbolo exato"
                  body="Use o campo ao lado para consultar uma ação da B3 ou um ativo cripto. Quando não houver busca, seus 5 itens recentes ficam disponíveis na coluna esquerda."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : displayQuote ? (
                <AssetDetails
                  quote={displayQuote}
                  title={liveQuoteQuery.data ? "Live quote" : "Cache hit"}
                  badge={
                    liveQuoteQuery.data
                      ? "latest data"
                      : displayQuote.cache.stale
                        ? "cached · stale"
                        : "cached"
                  }
                  className="flex-1"
                />
              ) : liveQuoteQuery.isFetching ||
                (cacheProbeQuery.data === null &&
                  !liveError &&
                  isValidSearchInput(normalizedQuery, mode)) ? (
                <ErrorState
                  title="Looking for it"
                  body={`A consulta exata para ${normalizedQuery} está em andamento.`}
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : showValidationHelp ? (
                <ErrorState
                  title="Entrada parcial ou inválida"
                  body={
                    mode === "stocks"
                      ? "A busca ao vivo só roda para tickers completos no formato ABCD1, ABCD11 ou ABCD11.XX."
                      : "A busca ao vivo só roda para símbolos cripto exatos com 2 a 15 caracteres."
                  }
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : liveError?.status === 404 ? (
                <ErrorState
                  title="Ativo não encontrado"
                  body={`Nenhuma cotação exata foi encontrada para ${debouncedQuery}.`}
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : liveError?.status === 422 ? (
                <ErrorState
                  title="Entrada inválida"
                  body="Revise o símbolo informado. A validação do backend rejeitou a consulta."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : liveError?.status === 401 ? (
                <ErrorState
                  title="Sessão expirada"
                  body="Sua sessão não é mais válida. Faça login novamente para continuar."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : liveError?.status === 502 ? (
                <ErrorState
                  title="Serviço indisponível"
                  body="O provedor de cotações está indisponível no momento. Tente novamente em instantes."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : cacheProbeQuery.error instanceof ApiRequestError &&
                cacheProbeQuery.error.status === 401 ? (
                <ErrorState
                  title="Sessão expirada"
                  body="Sua sessão não é mais válida. Faça login novamente para continuar."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              ) : (
                <ErrorState
                  title="Nenhum dado disponível"
                  body="Não foi possível resolver a cotação exata para a entrada atual."
                  className="flex flex-1 flex-col items-center justify-center"
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
