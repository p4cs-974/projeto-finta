import { describe, expect, it } from "vitest";

import { isAssetQuoteCacheStale } from "./get-asset";

describe("asset quote cache freshness", () => {
	it("marks entries as stale after five minutes", () => {
		const entry = {
			ticker: "PETR4",
			updatedAt: "2026-03-10T18:00:00.000Z",
			data: {
				ticker: "PETR4",
				name: "Petrobras",
				market: "B3" as const,
				currency: "BRL",
				price: 1,
				change: 0,
				changePercent: 0,
				quotedAt: "2026-03-10T18:00:00.000Z",
				logoUrl: null,
			},
		};

		expect(isAssetQuoteCacheStale(entry, new Date("2026-03-10T18:04:59.999Z"))).toBe(false);
		expect(isAssetQuoteCacheStale(entry, new Date("2026-03-10T18:05:00.000Z"))).toBe(true);
	});
});
