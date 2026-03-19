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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock3 className="size-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Buscas Recentes
        </p>
      </div>
      <ul className="space-y-2">
        {assets.slice(0, 5).map((item) => {
          const mode = getRecentMode(item.assetType);
          const href = `/search?mode=${mode}&q=${encodeURIComponent(item.symbol)}`;

          return (
            <li key={`${item.assetType}:${item.symbol}`}>
              <Link
                href={href}
                className="group flex items-center gap-3 border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/50"
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
                    {item.assetType === "stock" ? "Ação" : "Cripto"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(item.lastSelectedAt)}
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
