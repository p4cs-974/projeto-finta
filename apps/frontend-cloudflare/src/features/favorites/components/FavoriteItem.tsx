import type { FavoriteAsset } from "@finta/favorites";
import { StarOff } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

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

interface RemoveButtonProps {
  onRemove: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

function RemoveButton({ onRemove, disabled, ariaLabel }: RemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "group/remove relative flex shrink-0 items-center justify-start overflow-hidden rounded-none border border-transparent",
        "h-7 w-7 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]",
        "text-muted-foreground hover:border-border hover:bg-muted hover:text-rose-600",
        "dark:hover:text-rose-400",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:w-[84px] focus-within:w-[84px]",
        "max-[767px]:hover:w-7 max-[767px]:active:w-[84px] max-[767px]:focus-within:w-[84px]",
      )}
    >
      <StarOff className="ml-[7px] size-3.5 shrink-0 fill-current transition-colors" />
      <span
        className={cn(
          "ml-1.5 whitespace-nowrap pr-2.5 text-xs font-medium opacity-0 transition-opacity",
          "group-hover/remove:opacity-100",
          "max-[767px]:group-active/remove:opacity-100",
        )}
      >
        Remover
      </span>
    </button>
  );
}

interface FavoriteItemProps {
  item: FavoriteAsset;
  onRemove?: (item: FavoriteAsset) => void;
  removing?: boolean;
}

export function FavoriteItem({ item, onRemove, removing }: FavoriteItemProps) {
  return (
    <li className="flex items-center gap-4 border border-border bg-background px-4 py-4 transition-colors hover:bg-muted/45">
      <Link
        href={buildSearchHref(item.assetType, item.symbol)}
        className="flex min-w-0 flex-1 items-center gap-4"
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
      {onRemove && (
        <RemoveButton
          onRemove={() => onRemove(item)}
          disabled={removing}
          ariaLabel={`Remover ${item.symbol} dos favoritos`}
        />
      )}
    </li>
  );
}
