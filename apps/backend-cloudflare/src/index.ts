import { createNoopExecutionContext, type AppEnv } from "./app-env";
import { handleLogin } from "./adapters/http/identity-access/login";
import { handleRegister } from "./adapters/http/identity-access/register";
import { handleGetCachedQuote } from "./adapters/http/price-query/get-cached-quote";
import { handleGetLiveQuote } from "./adapters/http/price-query/get-live-quote";
import { handleStreamQuote } from "./adapters/http/price-query/stream-quote";
import { handleSearchCachedQuotes } from "./adapters/http/price-query/search-cached-quotes";
import { handleListFavorites } from "./adapters/http/favorites/list-favorites";
import { handleAddFavorite } from "./adapters/http/user-assets/add-favorite";
import { handleRemoveFavorite } from "./adapters/http/user-assets/remove-favorite";
import { handleListRecentSelections } from "./adapters/http/user-assets/list-recent-selections";
import { handleRecordRecentSelection } from "./adapters/http/user-assets/record-recent-selection";
import { apiError, errorResponse, json } from "./lib/http";
import { renderSwaggerUiHtml } from "./lib/docs";
import { createOpenApiDocument } from "./lib/openapi";

async function routeRequest(
  request: Request,
  env: AppEnv,
  ctx: ExecutionContext,
): Promise<Response> {
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

  if (request.method === "GET" && url.pathname === "/users/me/recent-assets") {
    return handleListRecentSelections(request, env);
  }

  if (request.method === "GET" && url.pathname === "/users/me/favorites") {
    return handleListFavorites(request, env);
  }

  if (request.method === "POST" && url.pathname === "/users/me/recent-assets") {
    return handleRecordRecentSelection(request, env);
  }

  if (request.method === "POST" && url.pathname === "/users/me/favorites") {
    return handleAddFavorite(request, env);
  }

  if (request.method === "DELETE" && url.pathname === "/users/me/favorites") {
    return handleRemoveFavorite(request, env);
  }

  if (request.method === "GET" && url.pathname === "/ativos/cache-search") {
    return handleSearchCachedQuotes(request, env);
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/ativos/") &&
    url.pathname.endsWith("/cache")
  ) {
    const rawTicker = url.pathname.slice("/ativos/".length, -"/cache".length);
    return handleGetCachedQuote(request, env, rawTicker);
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/ativos/") &&
    url.pathname.endsWith("/stream")
  ) {
    const rawTicker = url.pathname.slice("/ativos/".length, -"/stream".length);
    return handleStreamQuote(request, env, ctx, rawTicker);
  }

  if (request.method === "GET" && url.pathname.startsWith("/ativos/")) {
    const rawTicker = url.pathname.slice("/ativos/".length);
    return handleGetLiveQuote(request, env, ctx, rawTicker);
  }

  throw apiError(404, "NOT_FOUND", "Rota não encontrada");
}

export default {
  async fetch(
    request: Request,
    env: AppEnv,
    ctx?: ExecutionContext,
  ): Promise<Response> {
    try {
      return await routeRequest(
        request,
        env,
        ctx ?? createNoopExecutionContext(),
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
} satisfies ExportedHandler<AppEnv>;

export { routeRequest };
