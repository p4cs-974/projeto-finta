import type {
  IMarketDataGateway,
  PriceQuote,
  QuoteRequest,
  StockQuote,
} from "@finta/price-query";
import { ApplicationError, createApplicationError } from "@finta/shared-kernel";

const BRAPI_BASE_URL = "https://brapi.dev/api";
const BRAPI_TIMEOUT_MS = 5_000;

interface BrapiQuoteResult {
  symbol?: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number | string;
  logourl?: string | null;
}

interface BrapiQuoteResponse {
  results?: BrapiQuoteResult[];
}

function normalizeQuotedAt(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date(0).toISOString();
}

function normalizeLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function createTimeoutController() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BRAPI_TIMEOUT_MS);

  return {
    controller,
    clear() {
      clearTimeout(timeoutId);
    },
  };
}

export function adaptBrapiQuote(
  result: BrapiQuoteResult,
  ticker: string,
): StockQuote {
  return {
    ticker,
    name: result.longName?.trim() || result.shortName?.trim() || ticker,
    market: "B3",
    currency: result.currency?.trim() || "BRL",
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    quotedAt: normalizeQuotedAt(result.regularMarketTime),
    logoUrl: normalizeLogoUrl(result.logourl),
  };
}

async function parseBrapiError(response: Response): Promise<never> {
  if (response.status === 404) {
    throw createApplicationError(404, "ASSET_NOT_FOUND", "Ativo não encontrado");
  }

  throw createApplicationError(
    502,
    "EXTERNAL_SERVICE_ERROR",
    "Falha na requisição ao provedor de ativos",
  );
}

async function performBrapiRequest(
  input: string,
  brapiToken: string,
  fetchImpl: typeof fetch,
) {
  const timeout = createTimeoutController();

  try {
    const response = await fetchImpl(input, {
      method: "GET",
      headers: {
        authorization: `Bearer ${brapiToken}`,
        accept: "application/json",
      },
      signal: timeout.controller.signal,
    });

    if (!response.ok) {
      await parseBrapiError(response);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createApplicationError(
        502,
        "EXTERNAL_SERVICE_ERROR",
        "A requisição ao provedor de ativos expirou",
      );
    }

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw createApplicationError(
      502,
      "EXTERNAL_SERVICE_ERROR",
      "Falha na requisição ao provedor de ativos",
    );
  } finally {
    timeout.clear();
  }
}

async function fetchQuoteResult(
  symbol: string,
  brapiToken: string,
  fetchImpl: typeof fetch,
) {
  const response = await performBrapiRequest(
    `${BRAPI_BASE_URL}/quote/${symbol}`,
    brapiToken,
    fetchImpl,
  );
  const payload = await response.json<BrapiQuoteResponse>();
  const result = payload.results?.[0];

  if (!result) {
    throw createApplicationError(404, "ASSET_NOT_FOUND", "Ativo não encontrado");
  }

  return result;
}

export class BrapiMarketDataGateway implements IMarketDataGateway {
  constructor(
    private readonly brapiToken: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchQuote(input: QuoteRequest): Promise<PriceQuote> {
    const result = await fetchQuoteResult(
      input.symbol,
      this.brapiToken,
      this.fetchImpl,
    );

    return adaptBrapiQuote(result, input.symbol);
  }

  async fetchMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const results = await Promise.allSettled(
      symbols.map((symbol) =>
        fetchQuoteResult(symbol, this.brapiToken, this.fetchImpl).then(
          (result) => adaptBrapiQuote(result, symbol),
        ),
      ),
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled",
      )
      .map((r) => r.value);
  }
}
