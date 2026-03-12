"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bitcoin, Search, TrendingUp } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { SearchMode } from "@/features/price-query/presentation";

interface SearchControlsProps {
  initialMode: SearchMode;
  initialQuery: string;
}

export function SearchControls({
  initialMode,
  initialQuery,
}: SearchControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);

  const replaceUrl = useCallback(
    (nextMode: SearchMode, nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", nextMode);

      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim().toUpperCase());
      } else {
        params.delete("q");
      }

      const next = params.toString();
      const nextUrl = next ? `${pathname}?${next}` : pathname;
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (nextUrl === currentUrl) {
        return;
      }

      startTransition(() => {
        router.replace(nextUrl, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      replaceUrl(mode, query);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [mode, query, replaceUrl]);

  function handleModeChange(nextMode: SearchMode) {
    setMode(nextMode);
    replaceUrl(nextMode, query);
  }

  return (
    <div className="border border-border bg-background p-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
          <div
            className={`absolute inset-y-1 w-16 bg-primary transition-all duration-200 ${
              mode === "stocks" ? "left-1" : "left-[calc(100%-4.25rem)]"
            }`}
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
            {mode === "stocks" ? "Stocks" : <TrendingUp className="size-5" />}
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
            {mode === "crypto" ? "Crypto" : <Bitcoin className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
