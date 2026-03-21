import type { RecentAssetSelection } from "@finta/user-assets";
import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";

import {
  formatRelativeTime,
  getRecentMode,
} from "@/features/price-query/presentation";

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

interface RecentAssetsListProps {
  assets: RecentAssetSelection[];
}

export function RecentAssetsList({ assets }: RecentAssetsListProps) {
  if (assets.length === 0) {
    return (
      <div className="border border-dashed border-border bg-muted/30 p-6 text-center">
        <Clock3 className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Ainda não há buscas recentes.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Comece buscando um ativo.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Clock3 className="size-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Buscas Recentes
        </p>
      </div>
      <ul className="min-w-0 space-y-2">
        {assets.slice(0, 5).map((item) => {
          const mode = getRecentMode(item.assetType);
          const href = `/search?mode=${mode}&q=${encodeURIComponent(item.symbol)}`;

          return (
            <li key={`${item.assetType}:${item.symbol}`} className="min-w-0">
              <Link
                href={href}
                className="group flex w-full min-w-0 overflow-hidden border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <AssetLogo
                  symbol={item.symbol}
                  logoUrl={item.logoUrl}
                  className="size-10 shrink-0"
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-foreground">
                    {item.symbol}
                  </p>
                  <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                    {item.label}
                  </p>
                </div>
                <div className="hidden shrink-0 pl-3 text-right sm:block">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.assetType === "stock" ? "Ação" : "Cripto"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(item.lastSelectedAt)}
                  </p>
                </div>
                <ArrowUpRight className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
