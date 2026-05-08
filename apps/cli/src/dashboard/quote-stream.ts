import { useEffect, useMemo, useRef, useState } from "react";
import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";

import { getApiUrl } from "../api/client";
import { getDashboardAssetKey } from "./presentation";

export type QuoteStreamStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

function buildStreamUrl(symbol: string, assetType: AssetType): string {
  const params = new URLSearchParams();
  if (assetType === "crypto") {
    params.set("type", "crypto");
  }
  const query = params.toString();
  return `${getApiUrl()}/ativos/${encodeURIComponent(symbol)}/stream${query ? `?${query}` : ""}`;
}

type StreamConfig = {
  symbol: string;
  assetType: AssetType;
};

type SseCallbacks = {
  onOpen: () => void;
  onMessage: (
    data: QuoteWithCacheMeta | { error: { message: string; code?: string } },
  ) => void;
  onError: () => void;
};

async function readSseStream(response: Response, callbacks: SseCallbacks) {
  if (!response.ok || !response.body) {
    callbacks.onError();
    return;
  }

  callbacks.onOpen();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (!dataLine) continue;

      try {
        callbacks.onMessage(
          JSON.parse(dataLine.slice("data: ".length)) as QuoteWithCacheMeta,
        );
      } catch {
        callbacks.onError();
      }
    }
  }
}

export function useCliQuoteStreams({
  token,
  streams,
  initialQuotes,
  enabled = true,
}: {
  token: string | null;
  streams: StreamConfig[];
  initialQuotes: Map<string, QuoteWithCacheMeta>;
  enabled?: boolean;
}) {
  const [quotes, setQuotes] = useState(() => new Map(initialQuotes));
  const [statuses, setStatuses] = useState<Map<string, QuoteStreamStatus>>(
    () => {
      const next = new Map<string, QuoteStreamStatus>();
      for (const stream of streams) {
        next.set(
          getDashboardAssetKey(stream.symbol, stream.assetType),
          enabled ? "connecting" : "disconnected",
        );
      }
      return next;
    },
  );

  const streamsKey = useMemo(
    () =>
      streams
        .map((stream) => getDashboardAssetKey(stream.symbol, stream.assetType))
        .join("|"),
    [streams],
  );
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setQuotes(new Map(initialQuotes));
  }, [initialQuotes]);

  useEffect(() => {
    const controllers = new Map<string, AbortController>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const backoffs = new Map<string, number>();

    const setStatus = (key: string, status: QuoteStreamStatus) => {
      if (!mountedRef.current) return;
      setStatuses((prev) => {
        const next = new Map(prev);
        next.set(key, status);
        return next;
      });
    };

    if (!enabled || !token) {
      const next = new Map<string, QuoteStreamStatus>();
      for (const stream of streams) {
        next.set(
          getDashboardAssetKey(stream.symbol, stream.assetType),
          "disconnected",
        );
      }
      setStatuses(next);
      return () => {};
    }

    const connect = (stream: StreamConfig) => {
      const key = getDashboardAssetKey(stream.symbol, stream.assetType);
      controllers.get(key)?.abort();
      const controller = new AbortController();
      controllers.set(key, controller);
      setStatus(key, "connecting");

      void fetch(buildStreamUrl(stream.symbol, stream.assetType), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then((response) =>
          readSseStream(response, {
            onOpen() {
              backoffs.set(key, INITIAL_BACKOFF_MS);
              setStatus(key, "connected");
            },
            onMessage(data) {
              if ("error" in data) {
                setStatus(key, "error");
                return;
              }
              if (!mountedRef.current) return;
              setQuotes((prev) => {
                const next = new Map(prev);
                next.set(key, data);
                return next;
              });
            },
            onError() {
              setStatus(key, "error");
            },
          }),
        )
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error(`Quote stream failed for ${key}:`, error);
          setStatus(key, "error");
        })
        .finally(() => {
          if (controller.signal.aborted || !mountedRef.current || !enabled)
            return;
          const currentBackoff = backoffs.get(key) ?? INITIAL_BACKOFF_MS;
          backoffs.set(key, Math.min(currentBackoff * 2, MAX_BACKOFF_MS));
          timers.set(
            key,
            setTimeout(() => connect(stream), currentBackoff),
          );
        });
    };

    for (const stream of streams) {
      connect(stream);
    }

    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      for (const controller of controllers.values()) controller.abort();
      timers.clear();
      controllers.clear();
    };
  }, [enabled, token, streamsKey]);

  return { quotes, statuses };
}

export function useCliQuoteStream({
  token,
  symbol,
  assetType,
  initialQuote,
  enabled = true,
}: {
  token: string | null;
  symbol: string;
  assetType: AssetType;
  initialQuote: QuoteWithCacheMeta | null;
  enabled?: boolean;
}) {
  const initialQuotes = useMemo(() => {
    const map = new Map<string, QuoteWithCacheMeta>();
    if (initialQuote) {
      map.set(getDashboardAssetKey(symbol, assetType), initialQuote);
    }
    return map;
  }, [assetType, initialQuote, symbol]);
  const streams = useMemo(
    () => (symbol ? [{ symbol, assetType }] : []),
    [assetType, symbol],
  );
  const { quotes, statuses } = useCliQuoteStreams({
    token,
    streams,
    initialQuotes,
    enabled: enabled && Boolean(initialQuote),
  });
  const key = getDashboardAssetKey(symbol, assetType);

  return {
    quote: quotes.get(key) ?? initialQuote,
    status: statuses.get(key) ?? (enabled ? "connecting" : "disconnected"),
  };
}
