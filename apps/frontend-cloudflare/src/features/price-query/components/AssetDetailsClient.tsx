"use client";

import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import { TrendingDown, TrendingUp, Wifi, WifiOff } from "lucide-react";

import { RecordAssetView } from "@/components/search/record-asset-view";
import {
  formatMoney,
  formatRelativeTime,
  getQuoteLabel,
  getQuoteLogoUrl,
  isStockQuoteWithCache,
} from "@/features/price-query/presentation";
import { useQuoteStream } from "@/features/price-query/hooks/use-quote-stream";
import { FavoriteButton } from "@/features/price-query/components/FavoriteButton";

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

function ConnectionIndicator({
  status,
}: {
  status: ReturnType<typeof useQuoteStream>["status"];
}) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Wifi className="size-3.5" />
        <span>Atualizando</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
        <WifiOff className="size-3.5" />
        <span>Reconectando...</span>
      </div>
    );
  }

  return null;
}

interface AssetDetailsClientProps {
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta;
  initialFavorited?: boolean;
}

export function AssetDetailsClient({
  symbol,
  assetType,
  initialQuote,
  initialFavorited = false,
}: AssetDetailsClientProps) {
  const { quote, status } = useQuoteStream({
    symbol,
    assetType,
    initialQuote,
  });

  const isStock = isStockQuoteWithCache(quote);
  const delta = quote.data.change;
  const positive = delta >= 0;
  const logoUrl = getQuoteLogoUrl(quote);

  return (
    <section className="relative flex-1 overflow-hidden border border-border bg-card p-6 md:p-8">
      <RecordAssetView
        symbol={symbol}
        assetType={isStock ? "stock" : "crypto"}
        label={getQuoteLabel(quote)}
        market={isStock ? quote.data.market : null}
        currency={quote.data.currency}
        logoUrl={logoUrl}
      />
      <div className="relative flex flex-col gap-8">
        <div className="flex items-start gap-4">
          <AssetLogo symbol={symbol} logoUrl={logoUrl} className="size-14" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {symbol}
              </h1>
              <div className="ml-auto flex items-center gap-3">
                <ConnectionIndicator status={status} />
                <FavoriteButton symbol={symbol} assetType={assetType} initialFavorited={initialFavorited} />
              </div>
            </div>
            <p className="mt-2 max-w-xl overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground md:whitespace-normal md:leading-6">
              {getQuoteLabel(quote)}
            </p>
          </div>
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
            value={isStock ? quote.data.market : "Cripto"}
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
