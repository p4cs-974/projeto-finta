import { describe, expect, it } from "vitest";

import { HttpError } from "./http";
import {
	buildAssetQuoteCacheKey,
	buildAssetQuoteLockKey,
	buildCryptoQuoteCacheKey,
	buildCryptoQuoteLockKey,
	normalizeCryptoAssetSymbol,
	validateAssetTicker,
	validateAssetType,
	validateCryptoAssetSymbol,
} from "./assets";

describe("asset ticker validation", () => {
	it("trims and uppercases valid B3 tickers", () => {
		expect(validateAssetTicker(" petr4 ")).toBe("PETR4");
		expect(validateAssetTicker("vale3")).toBe("VALE3");
	});

	it("rejects invalid ticker formats", () => {
		expect(() => validateAssetTicker("PETR")).toThrowError(HttpError);
		expect(() => validateAssetTicker("PETR4.SA")).toThrowError(HttpError);
		expect(() => validateAssetTicker("1234")).toThrowError(HttpError);
	});
});

describe("crypto asset helpers", () => {
	it("normalizes crypto symbols with trim and uppercase", () => {
		expect(normalizeCryptoAssetSymbol(" btc ")).toBe("BTC");
		expect(normalizeCryptoAssetSymbol("eth-usdt")).toBe("ETH-USDT");
	});

	it("validates crypto symbols and the optional type", () => {
		expect(validateCryptoAssetSymbol("btc")).toBe("BTC");
		expect(validateCryptoAssetSymbol("eth.usd")).toBe("ETH.USD");
		expect(validateAssetType(null)).toBeNull();
		expect(validateAssetType("crypto")).toBe("crypto");
		expect(() => validateAssetType("stock")).toThrowError(HttpError);
		expect(() => validateCryptoAssetSymbol("b")).toThrowError(HttpError);
		expect(() => validateCryptoAssetSymbol("btc/usd")).toThrowError(HttpError);
	});

	it("builds cache and lock keys for B3 and crypto quotes", () => {
		expect(buildAssetQuoteCacheKey("PETR4")).toBe("asset-quote:v1:PETR4");
		expect(buildAssetQuoteLockKey("PETR4")).toBe("asset-quote-lock:v1:PETR4");
		expect(buildCryptoQuoteCacheKey("BTC")).toBe("crypto-quote:v1:BTC");
		expect(buildCryptoQuoteLockKey("BTC")).toBe("crypto-quote-lock:v1:BTC");
	});
});
