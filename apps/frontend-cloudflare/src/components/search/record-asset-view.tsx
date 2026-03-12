"use client";

import type { AssetType } from "@finta/shared-kernel";
import { useEffect, useRef } from "react";

interface RecordAssetViewProps {
  symbol: string;
  assetType: AssetType;
  label: string;
  market: string | null;
  currency: string | null;
  logoUrl: string | null;
}

export function RecordAssetView(props: RecordAssetViewProps) {
  const lastSentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const nextKey = `${props.assetType}:${props.symbol}`;

    if (lastSentKeyRef.current === nextKey) {
      return;
    }

    lastSentKeyRef.current = nextKey;

    fetch("/api/users/me/recent-assets", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        symbol: props.symbol,
        type: props.assetType,
        label: props.label,
        market: props.market,
        currency: props.currency,
        logoUrl: props.logoUrl,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [props]);

  return null;
}
