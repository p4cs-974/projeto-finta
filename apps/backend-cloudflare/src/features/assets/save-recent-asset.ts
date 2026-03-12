import { z } from "zod";

import type { AppEnv } from "../../index";
import { requireAuth } from "../../lib/auth";
import { validateAssetTicker, validateCryptoAssetSymbol } from "../../lib/assets";
import { apiError, parseJsonRequest } from "../../lib/http";
import { hasControlCharacters, normalizeDisplayText } from "../../lib/text";

import {
	trimRecentAssetsByUserId,
	upsertRecentAssetSelection,
} from "./recent-asset-repository";

const saveRecentAssetSchema = z
	.object({
		symbol: z.string().min(1),
		type: z.enum(["stock", "crypto"]),
		label: z
			.string()
			.transform(normalizeDisplayText)
			.refine((value) => value.length > 0 && !hasControlCharacters(value), {
				message: "Label is invalid",
			}),
		market: z
			.union([z.string(), z.null()])
			.transform((value) =>
				typeof value === "string" ? normalizeDisplayText(value) : null,
			)
			.refine(
				(value) =>
					value === null ||
					(value.length > 0 && !hasControlCharacters(value)),
				{
					message: "Market is invalid",
				},
			)
			.optional(),
		currency: z
			.union([z.string(), z.null()])
			.transform((value) =>
				typeof value === "string" ? normalizeDisplayText(value) : null,
			)
			.refine(
				(value) =>
					value === null ||
					(value.length > 0 && !hasControlCharacters(value)),
				{
					message: "Currency is invalid",
				},
			)
			.optional(),
		logoUrl: z
			.union([z.string().url(), z.null()])
			.optional(),
	})
	.strict();

function parseUserId(input: string): number {
	const userId = Number.parseInt(input, 10);

	if (!Number.isInteger(userId) || userId <= 0) {
		throw new Error("Authenticated user id is invalid");
	}

	return userId;
}

function validateSaveRecentAssetInput(input: unknown) {
	const parsed = saveRecentAssetSchema.safeParse(input);

	if (!parsed.success) {
		throw apiError(422, "VALIDATION_ERROR", "Invalid request body", {
			fieldErrors: parsed.error.flatten().fieldErrors,
		});
	}

	return {
		symbol:
			parsed.data.type === "crypto"
				? validateCryptoAssetSymbol(parsed.data.symbol)
				: validateAssetTicker(parsed.data.symbol),
		type: parsed.data.type,
		label: parsed.data.label,
		market: parsed.data.market ?? null,
		currency: parsed.data.currency ?? null,
		logoUrl: parsed.data.logoUrl ?? null,
	};
}

export async function handleSaveRecentAsset(request: Request, env: AppEnv): Promise<Response> {
	const auth = await requireAuth(request, env.JWT_SECRET);
	const input = validateSaveRecentAssetInput(await parseJsonRequest(request));
	const userId = parseUserId(auth.sub);

	await upsertRecentAssetSelection(env.DB, userId, input);
	await trimRecentAssetsByUserId(env.DB, userId, 5);

	return new Response(null, { status: 204 });
}
