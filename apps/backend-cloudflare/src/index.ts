import { handleLogin } from "./features/auth/login";
import { handleRegister } from "./features/auth/register";
import { apiError, errorResponse, json } from "./lib/http";
import { renderSwaggerUiHtml } from "./lib/docs";
import { createOpenApiDocument } from "./lib/openapi";

export interface AppEnv {
	DB: D1Database;
	JWT_SECRET: string;
}

async function routeRequest(request: Request, env: AppEnv): Promise<Response> {
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

	throw apiError(404, "NOT_FOUND", "Route not found");
}

export default {
	async fetch(request: Request, env: AppEnv): Promise<Response> {
		try {
			return await routeRequest(request, env);
		} catch (error) {
			return errorResponse(error);
		}
	},
} satisfies ExportedHandler<AppEnv>;

export { routeRequest };
