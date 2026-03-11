"use client";

import { ArrowUp, Bitcoin, Search, TrendingUp } from "lucide-react";

import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { startTransition, useDeferredValue, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/chevron-right";

type StockResult = {
  ticker: string;
  name: string;
  market: "B3";
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  quotedAt: string;
  logoUrl: string;
};

type CryptoResult = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  quotedAt: string;
};

type SearchResult = StockResult | CryptoResult;

const b3Results: StockResult[] = [
  {
    ticker: "PETR4",
    name: "Petróleo Brasileiro S.A. - Petrobras",
    market: "B3" as const,
    currency: "BRL",
    price: 37.42,
    change: 0.85,
    changePercent: 2.32,
    quotedAt: "2026-03-10T14:30:00.000Z",
    logoUrl: "https://brapi.dev/favicon.svg",
  },
  {
    ticker: "VALE3",
    name: "Vale S.A.",
    market: "B3" as const,
    currency: "BRL",
    price: 61.08,
    change: 1.23,
    changePercent: 2.05,
    quotedAt: "2026-03-10T14:28:00.000Z",
    logoUrl: "https://brapi.dev/favicon.svg",
  },
  {
    ticker: "ITUB4",
    name: "Itaú Unibanco Holding S.A.",
    market: "B3" as const,
    currency: "BRL",
    price: 33.95,
    change: -0.42,
    changePercent: -1.22,
    quotedAt: "2026-03-10T14:27:00.000Z",
    logoUrl: "https://brapi.dev/favicon.svg",
  },
  {
    ticker: "WEGE3",
    name: "WEG S.A.",
    market: "B3" as const,
    currency: "BRL",
    price: 54.11,
    change: 0.67,
    changePercent: 1.25,
    quotedAt: "2026-03-10T14:25:00.000Z",
    logoUrl: "https://brapi.dev/favicon.svg",
  },
];

const cryptoResults: CryptoResult[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    currency: "USD",
    price: 88432.15,
    change: 1250.5,
    changePercent: 1.43,
    quotedAt: "2026-03-10T14:30:00.000Z",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    currency: "USD",
    price: 2234.67,
    change: -45.23,
    changePercent: -1.98,
    quotedAt: "2026-03-10T14:28:00.000Z",
  },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMins) < 1) return "agora";
  if (Math.abs(diffMins) < 60) return rtf.format(-diffMins, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, "hour");
  return rtf.format(-diffDays, "day");
}

function isStockResult(result: SearchResult): result is StockResult {
  return "ticker" in result;
}

function getResultId(result: SearchResult) {
  return isStockResult(result) ? result.ticker : result.symbol;
}

function formatMoney(currency: string, value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function matchesSearch(result: SearchResult, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  const searchableText = isStockResult(result)
    ? `${result.name} ${result.ticker} ${result.market} ${result.currency}`
    : `${result.name} ${result.symbol} crypto ${result.currency}`;

  return searchableText.toLowerCase().includes(normalizedQuery);
}

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<"stocks" | "crypto">("stocks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(b3Results[0].ticker);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const results = searchMode === "stocks" ? b3Results : cryptoResults;
  const filteredResults = results.filter((result) =>
    matchesSearch(result, deferredSearchQuery),
  );
  const selectedResult =
    filteredResults.find((result) => getResultId(result) === selectedId) ??
    filteredResults[0] ??
    results[0];

  const hasVisibleResults = filteredResults.length > 0;

  function handleModeChange(nextMode: "stocks" | "crypto") {
    const nextResults = nextMode === "stocks" ? b3Results : cryptoResults;

    startTransition(() => {
      setSearchMode(nextMode);
      setSelectedId(getResultId(nextResults[0]));
      setSearchQuery("");
    });
  }

  function handleSelect(id: string) {
    startTransition(() => {
      setSelectedId(id);
    });
  }

  return (
    <main className="min-h-[calc(100svh-6rem)] px-4 pb-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <section className="grid border border-border bg-card lg:grid-cols-[minmax(320px,1fr)_minmax(0,1fr)]">
          <aside className="border-b border-border p-5 lg:border-r lg:border-b-0 lg:p-7">
            <div className="space-y-5">
              <div className="border border-border bg-background p-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      aria-label="Search"
                      name="instrument-search"
                      autoComplete="off"
                      placeholder="Search by name or ticker…"
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
                        left:
                          searchMode === "stocks"
                            ? 4
                            : "calc(100% - 4px - 4rem)",
                        right:
                          searchMode === "stocks"
                            ? "calc(100% - 4px - 4rem)"
                            : 4,
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
                        searchMode === "stocks"
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {searchMode === "stocks" ? (
                        "Stocks"
                      ) : (
                        <TrendingUp className="size-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange("crypto")}
                      className={`relative z-10 flex h-7 w-16 items-center justify-center px-3 text-sm font-medium transition-colors ${
                        searchMode === "crypto"
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {searchMode === "crypto" ? (
                        "Crypto"
                      ) : (
                        <Bitcoin className="size-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {hasVisibleResults ? (
                <ul
                  aria-label={`${searchMode} results`}
                  className="max-h-112 space-y-1 overflow-y-auto pr-1"
                >
                  {filteredResults.map((result) => {
                    const resultId = getResultId(result);
                    const isSelected = resultId === getResultId(selectedResult);

                    return (
                      <li key={resultId}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelect(resultId)}
                          className={`flex w-full items-center gap-3 border px-2 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                            isSelected
                              ? "border-border bg-muted"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                        >
                          <span className="size-9 shrink-0 rounded-full bg-muted ring-1 ring-border" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {result.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {resultId} •{" "}
                              {isStockResult(result)
                                ? `${result.market} • ${result.currency}`
                                : `Crypto • ${result.currency}`}
                            </span>
                          </span>
                          {isSelected && <ChevronRightIcon />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="border border-dashed border-border bg-background/70 px-4 py-6">
                  <p className="text-sm font-medium">No matches found</p>
                  <p className="text-sm text-muted-foreground">
                    Try another name or ticker.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section className="p-5 lg:p-7">
            <div className="flex h-full flex-col gap-6">
              <div className="flex items-start gap-5">
                <span className="size-28 shrink-0 bg-muted ring-1 ring-border" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-2xl font-medium tracking-tight">
                      {getResultId(selectedResult)}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {isStockResult(selectedResult)
                        ? selectedResult.market
                        : "Crypto"}
                    </span>
                  </div>
                  <p className="text-base text-muted-foreground">
                    {selectedResult.name}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 pt-1">
                    <span className="text-3xl font-semibold tracking-tight">
                      {formatMoney(
                        selectedResult.currency,
                        selectedResult.price,
                      )}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-base font-medium ${
                        selectedResult.change >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <ArrowUp
                        className={`size-4 ${
                          selectedResult.change < 0 ? "rotate-180" : ""
                        }`}
                      />
                      {selectedResult.change >= 0 ? "+" : ""}
                      {formatMoney(
                        selectedResult.currency,
                        selectedResult.change,
                      )}
                      <span className="text-muted-foreground">
                        ({selectedResult.changePercent >= 0 ? "+" : ""}
                        {selectedResult.changePercent.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid min-h-[320px] flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </p>
                  <p className="text-lg font-medium">
                    {isStockResult(selectedResult) ? "Stock" : "Cryptocurrency"}
                  </p>
                </div>

                <div className="space-y-1.5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Currency
                  </p>
                  <p className="text-lg font-medium">
                    {selectedResult.currency}
                  </p>
                </div>

                <div className="space-y-1.5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-lg font-medium tabular-nums">
                    {formatRelativeTime(new Date(selectedResult.quotedAt))}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
