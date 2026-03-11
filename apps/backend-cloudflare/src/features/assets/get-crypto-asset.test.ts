import { describe, expect, it } from "vitest";

import { isCryptoAssetCacheStale } from "./get-crypto-asset";

describe("crypto asset cache freshness", () => {
	it("marks entries as stale after five minutes", () => {
		const entry = {
			symbol: "BTC",
			updatedAt: "2026-03-10T18:00:00.000Z",
			data: {
				symbol: "BTC",
				name: "Bitcoin",
				currency: "USD",
				price: 1,
				change: 0,
				changePercent: 0,
				quotedAt: "2026-03-10T18:00:00.000Z",
			},
		};

		expect(isCryptoAssetCacheStale(entry, new Date("2026-03-10T18:04:59.999Z"))).toBe(false);
		expect(isCryptoAssetCacheStale(entry, new Date("2026-03-10T18:05:00.000Z"))).toBe(true);
	});
});
