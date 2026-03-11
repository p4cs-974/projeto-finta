import { handleGetAsset } from "./features/assets/get-asset";
import { handleGetCryptoAsset } from "./features/assets/get-crypto-asset";
import { handleLogin } from "./features/auth/login";
import { handleRegister } from "./features/auth/register";
import { validateAssetType } from "./lib/assets";
import { apiError, errorResponse, json } from "./lib/http";
import { renderSwaggerUiHtml } from "./lib/docs";
import { createOpenApiDocument } from "./lib/openapi";

export interface AppEnv {
	DB: D1Database;
	JWT_SECRET: string;
	BRAPI_TOKEN: string;
	ASSET_CACHE: KVNamespace;
}

function createNoopExecutionContext(): ExecutionContext {
	return {
		waitUntil() {},
		passThroughOnException() {},
		props: {},
	};
}

async function routeRequest(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);

	if (request.method === "GET" && url.pathname === "/openapi.json") {
		return json(createOpenApiDocument(url.origin));
	}

	if (request.method === "GET" && url.pathname === "/docs") {
		return new Response(renderSwaggerUiHtml(`${url.origin}/openapi.json`), {
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		});
	}

	if (request.method === "POST" && url.pathname === "/auth/register") {
		return handleRegister(request, env);
	}

	if (request.method === "POST" && url.pathname === "/auth/login") {
		return handleLogin(request, env);
	}

	if (request.method === "GET" && url.pathname.startsWith("/ativos/")) {
		const rawTicker = url.pathname.slice("/ativos/".length);
		if (validateAssetType(url.searchParams.get("type")) === "crypto") {
			return handleGetCryptoAsset(request, env, ctx, rawTicker);
		}

		return handleGetAsset(request, env, ctx, rawTicker);
	}

	throw apiError(404, "NOT_FOUND", "Route not found");
}

export default {
	async fetch(request: Request, env: AppEnv, ctx?: ExecutionContext): Promise<Response> {
		try {
			return await routeRequest(request, env, ctx ?? createNoopExecutionContext());
		} catch (error) {
			return errorResponse(error);
		}
	},
} satisfies ExportedHandler<AppEnv>;

export { routeRequest };
