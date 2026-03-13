import type {
  CryptoQuote,
  IMarketDataGateway,
  QuoteRequest,
} from "@finta/price-query";
import { ApplicationError, createApplicationError } from "@finta/shared-kernel";

const COINCAP_BASE_URL = "https://rest.coincap.io/v3";
const COINCAP_TIMEOUT_MS = 5_000;

interface CoinCapAssetSearchItem {
  id?: string;
  symbol?: string;
  name?: string;
}

interface CoinCapAssetSearchResponse {
  data?: CoinCapAssetSearchItem[];
}

interface CoinCapAssetDetail {
  id?: string;
  symbol?: string;
  name?: string;
  priceUsd?: string;
  changePercent24Hr?: string;
}

interface CoinCapAssetDetailResponse {
  data?: CoinCapAssetDetail;
}

function createTimeoutController() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COINCAP_TIMEOUT_MS);

  return {
    controller,
    clear() {
      clearTimeout(timeoutId);
    },
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return await response.json<T>();
  } catch {
    throw createApplicationError(
      502,
      "EXTERNAL_SERVICE_ERROR",
      "Falha na requisição ao provedor de ativos",
    );
  }
}

async function performCoinCapRequest(
  input: string,
  apiKey: string,
  fetchImpl: typeof fetch,
) {
  const timeout = createTimeoutController();

  try {
    const response = await fetchImpl(input, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
      signal: timeout.controller.signal,
    });

    if (!response.ok) {
      throw createApplicationError(
        502,
        "EXTERNAL_SERVICE_ERROR",
        "Falha na requisição ao provedor de ativos",
      );
    }

    return response;
  } catch (error) {
    if (isAbortError(error)) {
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

function findExactSymbolMatch(
  assets: CoinCapAssetSearchItem[] | undefined,
  symbol: string,
) {
  return assets?.find(
    (asset) => asset.symbol?.trim().toUpperCase() === symbol.toUpperCase(),
  );
}

function parseFiniteNumber(
  value: string | undefined,
  fieldName: string,
): number {
  if (typeof value !== "string") {
    throw createApplicationError(
      502,
      "EXTERNAL_SERVICE_ERROR",
      `A resposta do provedor de ativos não contém ${fieldName}`,
    );
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw createApplicationError(
      502,
      "EXTERNAL_SERVICE_ERROR",
      `A resposta do provedor de ativos contém ${fieldName} inválido`,
    );
  }

  return parsedValue;
}

export function derivePriceChange(price: number, changePercent: number) {
  const denominator = 100 + changePercent;

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(changePercent) ||
    denominator === 0
  ) {
    return 0;
  }

  const change = price * (changePercent / denominator);
  return Number.isFinite(change) ? change : 0;
}

export function adaptCoinCapCryptoQuote(
  detail: CoinCapAssetDetail,
  requestedSymbol: string,
  quotedAt: string,
): CryptoQuote {
  const price = parseFiniteNumber(detail.priceUsd, "priceUsd");
  const changePercent = parseFiniteNumber(
    detail.changePercent24Hr,
    "changePercent24Hr",
  );

  return {
    symbol: requestedSymbol.toUpperCase(),
    name: detail.name?.trim() || requestedSymbol.toUpperCase(),
    currency: "USD",
    price,
    changePercent,
    change: derivePriceChange(price, changePercent),
    quotedAt,
  };
}

export class CoinCapMarketDataGateway implements IMarketDataGateway {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async fetchQuote(input: QuoteRequest) {
    const symbol = input.symbol.toUpperCase();
    const searchResponse = await performCoinCapRequest(
      `${COINCAP_BASE_URL}/assets?search=${encodeURIComponent(symbol)}`,
      this.apiKey,
      this.fetchImpl,
    );
    const searchPayload =
      await parseJson<CoinCapAssetSearchResponse>(searchResponse);
    const match = findExactSymbolMatch(searchPayload.data, symbol);

    if (!match?.id) {
      throw createApplicationError(404, "ASSET_NOT_FOUND", "Ativo não encontrado");
    }

    const detailResponse = await performCoinCapRequest(
      `${COINCAP_BASE_URL}/assets/${encodeURIComponent(match.id)}`,
      this.apiKey,
      this.fetchImpl,
    );
    const detailPayload =
      await parseJson<CoinCapAssetDetailResponse>(detailResponse);

    if (!detailPayload.data) {
      throw createApplicationError(
        502,
        "EXTERNAL_SERVICE_ERROR",
        "Falha na requisição ao provedor de ativos",
      );
    }

    return adaptCoinCapCryptoQuote(
      detailPayload.data,
      symbol,
      this.now().toISOString(),
    );
  }
}
