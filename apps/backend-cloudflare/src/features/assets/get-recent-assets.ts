import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import { json } from "../../lib/http";

import { listRecentAssetsByUserId } from "./recent-asset-repository";

function parseUserId(input: string): number {
	const userId = Number.parseInt(input, 10);

	if (!Number.isInteger(userId) || userId <= 0) {
		throw new Error("Authenticated user id is invalid");
	}

	return userId;
}

export async function handleGetRecentAssets(request: Request, env: AppEnv): Promise<Response> {
	const auth = await requireAuth(request, env.JWT_SECRET);
	const items = await listRecentAssetsByUserId(env.DB, parseUserId(auth.sub), 5);

	return json({
		data: items.map((item) => ({
			symbol: item.symbol,
			type: item.asset_type,
			label: item.label,
			market: item.market,
			currency: item.currency,
			logoUrl: item.logo_url,
			lastSelectedAt: item.last_selected_at,
		})),
	});
}
