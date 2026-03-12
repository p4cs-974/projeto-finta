export interface RecentAssetSelectionRecord {
	id: number;
	user_id: number;
	symbol: string;
	asset_type: "stock" | "crypto";
	label: string;
	market: string | null;
	currency: string | null;
	logo_url: string | null;
	last_selected_at: string;
}

export interface RecentAssetSelectionInput {
	symbol: string;
	type: "stock" | "crypto";
	label: string;
	market?: string | null;
	currency?: string | null;
	logoUrl?: string | null;
}

export async function listRecentAssetsByUserId(
	db: D1Database,
	userId: number,
	limit: number,
): Promise<RecentAssetSelectionRecord[]> {
	const result = await db
		.prepare(
			[
				"SELECT id, user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at",
				"FROM recent_asset_selections",
				"WHERE user_id = ?",
				"ORDER BY last_selected_at DESC, id DESC",
				"LIMIT ?",
			].join(" "),
		)
		.bind(userId, limit)
		.all<RecentAssetSelectionRecord>();

	return result.results ?? [];
}

export async function upsertRecentAssetSelection(
	db: D1Database,
	userId: number,
	selection: RecentAssetSelectionInput,
	now: Date = new Date(),
): Promise<void> {
	await db
		.prepare(
			[
				"INSERT INTO recent_asset_selections",
				"(user_id, symbol, asset_type, label, market, currency, logo_url, last_selected_at)",
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				"ON CONFLICT(user_id, symbol, asset_type) DO UPDATE SET",
				"label = excluded.label,",
				"market = excluded.market,",
				"currency = excluded.currency,",
				"logo_url = excluded.logo_url,",
				"last_selected_at = excluded.last_selected_at",
			].join(" "),
		)
		.bind(
			userId,
			selection.symbol,
			selection.type,
			selection.label,
			selection.market ?? null,
			selection.currency ?? null,
			selection.logoUrl ?? null,
			now.toISOString(),
		)
		.run();
}

export async function trimRecentAssetsByUserId(
	db: D1Database,
	userId: number,
	keep = 5,
): Promise<void> {
	await db
		.prepare(
			[
				"DELETE FROM recent_asset_selections",
				"WHERE user_id = ?",
				"AND id IN (",
				"SELECT id FROM recent_asset_selections",
				"WHERE user_id = ?",
				"ORDER BY last_selected_at DESC, id DESC",
				"LIMIT -1 OFFSET ?",
				")",
			].join(" "),
		)
		.bind(userId, userId, keep)
		.run();
}
