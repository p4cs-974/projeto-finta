"use client";

import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import { TrendingDown, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useMemo } from "react";

import { useMultiQuoteStream } from "@/features/price-query/hooks/use-multi-quote-stream";
import {
  formatMoney,
  getQuoteLogoUrl,
  getQuoteSymbol,
  isStockQuoteWithCache,
} from "@/features/price-query/presentation";

interface MarketAsset {
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta;
}

interface MarketData {
  gainers: MarketAsset[];
  losers: MarketAsset[];
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

function MarketAssetRow({
  asset,
  quote,
  status,
}: {
  asset: MarketAsset;
  quote: QuoteWithCacheMeta;
  status: "connecting" | "connected" | "error";
}) {
  const symbol = getQuoteSymbol(quote);
  const logoUrl = getQuoteLogoUrl(quote);
  const delta = quote.data.change;
  const positive = delta >= 0;
  const changePercent = quote.data.changePercent;

  return (
    <div className="flex items-center gap-3 border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/50">
      <AssetLogo
        symbol={symbol}
        logoUrl={logoUrl}
        className="size-9 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{symbol}</p>
        <p className="text-xs text-muted-foreground">
          {isStockQuoteWithCache(quote) ? quote.data.market : "Cripto"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground">
          {formatMoney(quote.data.currency, quote.data.price)}
        </p>
        <div className="flex items-center justify-end gap-1">
          <div
            className={`flex items-center gap-0.5 text-xs ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {positive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            <span>
              {changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="shrink-0">
        {status === "connected" ? (
          <Wifi className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : status === "error" ? (
          <WifiOff className="size-3.5 text-rose-600 dark:text-rose-400" />
        ) : null}
      </div>
    </div>
  );
}

interface MarketOverviewClientProps {
  data: MarketData;
}

export function MarketOverviewClient({ data }: MarketOverviewClientProps) {
  const allAssets = useMemo(
    () => [...data.gainers, ...data.losers],
    [data.gainers, data.losers],
  );
  const initialQuotes = useMemo(() => {
    const quotes = new Map<string, QuoteWithCacheMeta>();

    for (const asset of allAssets) {
      const key = `${asset.assetType}:${asset.symbol}`;
      quotes.set(key, asset.initialQuote);
    }

    return quotes;
  }, [allAssets]);
  const streams = useMemo(
    () =>
      allAssets.map((asset) => ({
        symbol: asset.symbol,
        assetType: asset.assetType,
      })),
    [allAssets],
  );

  const { quotes, statuses } = useMultiQuoteStream({
    streams,
    initialQuotes,
    enabled: true,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Maiores Altas
          </p>
        </div>
        <ul className="space-y-2">
          {data.gainers.map((asset) => {
            const key = `${asset.assetType}:${asset.symbol}`;
            const quote = quotes.get(key) ?? asset.initialQuote;
            const status = statuses.get(key) ?? "connecting";

            return (
              <li key={key}>
                <MarketAssetRow asset={asset} quote={quote} status={status} />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Maiores Baixas
          </p>
        </div>
        <ul className="space-y-2">
          {data.losers.map((asset) => {
            const key = `${asset.assetType}:${asset.symbol}`;
            const quote = quotes.get(key) ?? asset.initialQuote;
            const status = statuses.get(key) ?? "connecting";

            return (
              <li key={key}>
                <MarketAssetRow asset={asset} quote={quote} status={status} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
