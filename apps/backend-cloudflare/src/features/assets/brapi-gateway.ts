import { HttpError, apiError } from "../../lib/http";

import type { AssetQuote, CryptoAssetQuote } from "./types";

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

async function parseBrapiError(response: Response): Promise<never> {
	if (response.status === 404) {
		throw apiError(404, "ASSET_NOT_FOUND", "Asset not found");
	}

	throw apiError(502, "EXTERNAL_SERVICE_ERROR", "Asset provider request failed");
}

async function performBrapiRequest(
	input: string,
	brapiToken: string,
	fetchImpl: typeof fetch,
): Promise<Response> {
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
			throw apiError(502, "EXTERNAL_SERVICE_ERROR", "Asset provider request timed out");
		}

		if (error instanceof HttpError) {
			throw error;
		}

		throw apiError(502, "EXTERNAL_SERVICE_ERROR", "Asset provider request failed");
	} finally {
		timeout.clear();
	}
}

export function adaptBrapiQuote(result: BrapiQuoteResult, ticker: string): AssetQuote {
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

export function adaptBrapiCryptoQuote(result: BrapiQuoteResult, symbol: string): CryptoAssetQuote {
	return {
		symbol,
		name: result.longName?.trim() || result.shortName?.trim() || symbol,
		currency: result.currency?.trim() || "USD",
		price: result.regularMarketPrice ?? 0,
		change: result.regularMarketChange ?? 0,
		changePercent: result.regularMarketChangePercent ?? 0,
		quotedAt: normalizeQuotedAt(result.regularMarketTime),
	};
}

async function fetchQuoteResult(
	symbol: string,
	brapiToken: string,
	fetchImpl: typeof fetch,
): Promise<BrapiQuoteResult> {
	const response = await performBrapiRequest(
		`${BRAPI_BASE_URL}/quote/${symbol}`,
		brapiToken,
		fetchImpl,
	);
	const payload = await response.json<BrapiQuoteResponse>();
	const result = payload.results?.[0];

	if (!result) {
		throw apiError(404, "ASSET_NOT_FOUND", "Asset not found");
	}

	return result;
}

export async function fetchBrapiAssetQuote(
	ticker: string,
	brapiToken: string,
	fetchImpl: typeof fetch = fetch,
): Promise<AssetQuote> {
	return adaptBrapiQuote(await fetchQuoteResult(ticker, brapiToken, fetchImpl), ticker);
}

export async function fetchBrapiCryptoQuote(
	symbol: string,
	brapiToken: string,
	fetchImpl: typeof fetch = fetch,
): Promise<CryptoAssetQuote> {
	return adaptBrapiCryptoQuote(await fetchQuoteResult(symbol, brapiToken, fetchImpl), symbol);
}
