"use client";

import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import { useEffect, useRef, useState } from "react";

interface StreamConfig {
  symbol: string;
  assetType: AssetType;
}

interface UseMultiQuoteStreamOptions {
  streams: StreamConfig[];
  initialQuotes: Map<string, QuoteWithCacheMeta>;
  enabled?: boolean;
}

interface StreamState {
  quotes: Map<string, QuoteWithCacheMeta>;
  statuses: Map<string, "connecting" | "connected" | "error">;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function buildStreamUrl(symbol: string, assetType: AssetType): string {
  const params = new URLSearchParams();
  if (assetType === "crypto") {
    params.set("type", "crypto");
  }
  return `/api/assets/${encodeURIComponent(symbol)}/stream${params.toString() ? `?${params.toString()}` : ""}`;
}

function getStreamKey(symbol: string, assetType: AssetType): string {
  return `${assetType}:${symbol}`;
}

export function useMultiQuoteStream({
  streams,
  initialQuotes,
  enabled = true,
}: UseMultiQuoteStreamOptions): StreamState {
  const [quotes, setQuotes] = useState<Map<string, QuoteWithCacheMeta>>(
    () => new Map(initialQuotes),
  );
  const [statuses, setStatuses] = useState<
    Map<string, "connecting" | "connected" | "error">
  >(() => {
    const map = new Map<string, "connecting" | "connected" | "error">();
    for (const { symbol, assetType } of streams) {
      map.set(getStreamKey(symbol, assetType), "connecting");
    }
    return map;
  });

  const backoffRef = useRef(new Map<string, number>());
  const eventSourcesRef = useRef(new Map<string, EventSource>());
  const reconnectTimeoutsRef = useRef(new Map<string, NodeJS.Timeout>());
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      const newStatuses = new Map<
        string,
        "connecting" | "connected" | "error"
      >();
      for (const { symbol, assetType } of streams) {
        newStatuses.set(getStreamKey(symbol, assetType), "connecting");
      }
      setStatuses(newStatuses);
      return;
    }

    const closeAll = () => {
      for (const [, timeout] of reconnectTimeoutsRef.current) {
        clearTimeout(timeout);
      }
      reconnectTimeoutsRef.current.clear();
      for (const [, es] of eventSourcesRef.current) {
        es.close();
      }
      eventSourcesRef.current.clear();
    };

    const connect = (symbol: string, assetType: AssetType) => {
      const key = getStreamKey(symbol, assetType);
      const existingEs = eventSourcesRef.current.get(key);
      if (existingEs) {
        existingEs.close();
      }

      setStatuses((prev) => {
        const next = new Map(prev);
        next.set(key, "connecting");
        return next;
      });

      const url = buildStreamUrl(symbol, assetType);
      const eventSource = new EventSource(url);
      eventSourcesRef.current.set(key, eventSource);

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        backoffRef.current.set(key, INITIAL_BACKOFF_MS);
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(key, "connected");
          return next;
        });
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as
            | QuoteWithCacheMeta
            | { error: { message: string } };
          if ("error" in data) {
            console.error(`Quote stream error for ${key}:`, data.error.message);
            setStatuses((prev) => {
              const next = new Map(prev);
              next.set(key, "error");
              return next;
            });
            return;
          }
          setQuotes((prev) => {
            const next = new Map(prev);
            next.set(key, data);
            return next;
          });
        } catch (error) {
          console.error(
            `Failed to parse quote stream message for ${key}:`,
            error,
          );
        }
      };

      eventSource.onerror = () => {
        if (!mountedRef.current) return;
        eventSource.close();
        eventSourcesRef.current.delete(key);
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(key, "error");
          return next;
        });

        const currentBackoff =
          backoffRef.current.get(key) ?? INITIAL_BACKOFF_MS;
        backoffRef.current.set(
          key,
          Math.min(currentBackoff * 2, MAX_BACKOFF_MS),
        );

        const timeout = setTimeout(() => {
          if (mountedRef.current && enabled) {
            connect(symbol, assetType);
          }
        }, currentBackoff);
        reconnectTimeoutsRef.current.set(key, timeout);
      };
    };

    for (const { symbol, assetType } of streams) {
      connect(symbol, assetType);
    }

    return () => {
      closeAll();
    };
  }, [streams, enabled]);

  useEffect(() => {
    setQuotes(new Map(initialQuotes));
  }, [initialQuotes]);

  return { quotes, statuses };
}
