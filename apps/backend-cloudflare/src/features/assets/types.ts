export interface AssetQuote {
	ticker: string;
	name: string;
	market: "B3";
	currency: string;
	price: number;
	change: number;
	changePercent: number;
	quotedAt: string;
	logoUrl: string | null;
}

export interface AssetQuoteCacheEntry {
	ticker: string;
	updatedAt: string;
	data: AssetQuote;
}

export interface AssetQuoteCacheMeta {
	key: string;
	updatedAt: string;
	stale: boolean;
	source: "cache" | "live";
}

export interface AssetQuoteWithCacheResponse {
	data: AssetQuote;
	cache: AssetQuoteCacheMeta;
}

export interface CryptoAssetQuote {
	symbol: string;
	name: string;
	currency: string;
	price: number;
	change: number;
	changePercent: number;
	quotedAt: string;
}

export interface CryptoAssetCacheEntry {
	symbol: string;
	updatedAt: string;
	data: CryptoAssetQuote;
}

export interface CryptoAssetQuoteResponse {
	data: CryptoAssetQuote;
	cache: {
		key: string;
		updatedAt: string;
		stale: boolean;
		source: "cache" | "live";
	};
}

export interface RecentAssetSelection {
	symbol: string;
	type: "stock" | "crypto";
	label: string;
	market: string | null;
	currency: string | null;
	logoUrl: string | null;
	lastSelectedAt: string;
}

export interface CachedAssetSearchResponse {
	data: Array<AssetQuoteWithCacheResponse | CryptoAssetQuoteResponse>;
}
