"use client";

import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import { useEffect, useRef, useState } from "react";

function buildStreamUrl(symbol: string, assetType: AssetType): string {
  const params = new URLSearchParams();
  if (assetType === "crypto") {
    params.set("type", "crypto");
  }
  return `/api/assets/${encodeURIComponent(symbol)}/stream${params.toString() ? `?${params.toString()}` : ""}`;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface UseQuoteStreamOptions {
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta;
  enabled?: boolean;
}

interface UseQuoteStreamReturn {
  quote: QuoteWithCacheMeta;
  status: ConnectionStatus;
  reconnect: () => void;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export function useQuoteStream({
  symbol,
  assetType,
  initialQuote,
  enabled = true,
}: UseQuoteStreamOptions): UseQuoteStreamReturn {
  const [quote, setQuote] = useState<QuoteWithCacheMeta>(initialQuote);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const closeConnection = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = (backoff: number) => {
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, backoff);
    };

    const connect = () => {
      closeConnection();

      if (!enabled) {
        setStatus("disconnected");
        return;
      }

      setStatus("connecting");

      const url = buildStreamUrl(symbol, assetType);
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        setStatus("connected");
        backoffRef.current = INITIAL_BACKOFF_MS;
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as
            | QuoteWithCacheMeta
            | { error: { message: string } };
          if ("error" in data) {
            console.error("Quote stream error:", data.error.message);
            setStatus("error");
            return;
          }
          setQuote(data);
        } catch (error) {
          console.error("Failed to parse quote stream message:", error);
        }
      };

      eventSource.onerror = () => {
        if (!mountedRef.current) return;
        eventSource.close();
        eventSourceRef.current = null;
        setStatus("error");

        const backoff = backoffRef.current;
        backoffRef.current = Math.min(backoff * 2, MAX_BACKOFF_MS);

        scheduleReconnect(backoff);
      };
    };

    connect();

    return () => {
      closeConnection();
    };
  }, [symbol, assetType, enabled]);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    backoffRef.current = INITIAL_BACKOFF_MS;
    setStatus("connecting");

    const url = buildStreamUrl(symbol, assetType);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus("connected");
      backoffRef.current = INITIAL_BACKOFF_MS;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as
          | QuoteWithCacheMeta
          | { error: { message: string } };
        if ("error" in data) {
          console.error("Quote stream error:", data.error.message);
          setStatus("error");
          return;
        }
        setQuote(data);
      } catch (error) {
        console.error("Failed to parse quote stream message:", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      setStatus("error");

      const backoff = backoffRef.current;
      backoffRef.current = Math.min(backoff * 2, MAX_BACKOFF_MS);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnect();
      }, backoff);
    };
  };

  return { quote, status, reconnect };
}
