import type { QuoteWithCacheMeta } from "@finta/price-query";
import { PriceQueryService, validateQuoteSymbol } from "@finta/price-query";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { CloudflareKvQuoteSnapshotStore } from "../../price-query/cloudflare-kv-quote-snapshot-store";
import { createMarketDataGateway } from "../../price-query/create-market-data-gateway";
import { parseRequestedAssetType } from "../shared";

const POLL_INTERVAL_MS = 5000;
const KEEPALIVE_INTERVAL_MS = 15000;

function formatSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function handleStreamQuote(
  request: Request,
  env: AppEnv,
  ctx: ExecutionContext,
  rawSymbol: string,
): Promise<Response> {
  await requireAuth(request, env.JWT_SECRET, env.DB);

  const assetType = parseRequestedAssetType(
    new URL(request.url).searchParams.get("type"),
  );
  const symbol = validateQuoteSymbol(assetType, rawSymbol);

  const quoteSnapshotStore = new CloudflareKvQuoteSnapshotStore(
    env.ASSET_CACHE,
  );
  const marketDataGateway = createMarketDataGateway(env);
  const service = new PriceQueryService({
    marketDataGateway,
    quoteSnapshotStore,
    scheduleTask(task) {
      ctx.waitUntil(task);
    },
    onRefreshError(error, input) {
      console.error("Failed to refresh asset quote cache", {
        assetType: input.assetType,
        symbol: input.symbol,
        error,
      });
    },
  });

  let lastQuoteJson: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(data)));
        } catch {
          // Client disconnected
        }
      };

      const sendError = (message: string, code?: string) => {
        sendEvent({ error: { message, code } });
      };

      const poll = async () => {
        try {
          const quote = await service.getLiveQuote({ assetType, symbol });
          const quoteJson = JSON.stringify(quote);

          if (quoteJson !== lastQuoteJson) {
            lastQuoteJson = quoteJson;
            sendEvent(quote);
          }
        } catch (error) {
          console.error("Stream poll error:", error);
          sendError("Failed to fetch quote update");
        }
      };

      await poll();

      const pollInterval = setInterval(poll, POLL_INTERVAL_MS);

      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(pollInterval);
          clearInterval(keepaliveInterval);
        }
      }, KEEPALIVE_INTERVAL_MS);

      const abortHandler = () => {
        clearInterval(pollInterval);
        clearInterval(keepaliveInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      request.signal?.addEventListener("abort", abortHandler);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
