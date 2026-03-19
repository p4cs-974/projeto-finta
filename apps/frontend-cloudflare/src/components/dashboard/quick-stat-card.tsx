"use client";

import {
  Heart,
  type LucideIcon,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  search: Search,
  "trending-up": TrendingUp,
  "refresh-cw": RefreshCw,
};

interface QuickStatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof iconMap;
}

export function QuickStatCard({ label, value, icon }: QuickStatCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/30">
          {Icon && <Icon className="size-5 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}
