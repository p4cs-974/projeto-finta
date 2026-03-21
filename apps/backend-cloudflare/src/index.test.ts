import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuoteCacheKey, type QuoteRequest } from "@finta/price-query";

import worker from "./index";
import { signJwt } from "./lib/jwt";
import { hashPassword } from "./lib/password";
import { createFakeD1Database } from "./test/fake-d1";
import { createFakeKvNamespace } from "./test/fake-kv";

const JWT_SECRET = "test-secret";
const BRAPI_TOKEN = "brapi-test-token";
const COINCAP_API_KEY = "coincap-test-token";

function buildAssetQuoteCacheKey(symbol: string) {
  return buildQuoteCacheKey({
    assetType: "stock",
    symbol,
  } satisfies QuoteRequest);
}

function buildCryptoQuoteCacheKey(symbol: string) {
  return buildQuoteCacheKey({
    assetType: "crypto",
    symbol,
  } satisfies QuoteRequest);
}

function createEnv(fakeDb: ReturnType<typeof createFakeD1Database>) {
  return {
    DB: fakeDb.db,
    JWT_SECRET,
    BRAPI_TOKEN,
    COINCAP_API_KEY,
    ASSET_CACHE: createFakeKvNamespace(),
  };
}

function createCoinCapFetchImplementation(
  detailsBySymbol: Record<
    string,
    {
      id?: string;
      name: string;
      priceUsd?: string;
      changePercent24Hr?: string;
    } | null
  >,
) {
  return async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname === "/v3/assets") {
      const symbol = parsedUrl.searchParams.get("search")?.toUpperCase() ?? "";
      const detail = detailsBySymbol[symbol];

      return new Response(
        JSON.stringify({
          data: detail
            ? [{ id: detail.id ?? symbol.toLowerCase(), symbol, name: detail.name }]
            : [],
        }),
        { status: 200 },
      );
    }

    const id = parsedUrl.pathname.replace("/v3/assets/", "");
    const matchedEntry = Object.entries(detailsBySymbol).find(
      ([symbol, detail]) =>
        detail && (detail.id ?? symbol.toLowerCase()) === id,
    );

    if (!matchedEntry?.[1]) {
      return new Response(JSON.stringify({ data: null }), { status: 404 });
    }

    const [symbol, detail] = matchedEntry;

    return new Response(
      JSON.stringify({
        data: {
          id,
          symbol,
          name: detail.name,
          priceUsd: detail.priceUsd ?? "0",
          changePercent24Hr: detail.changePercent24Hr ?? "0",
        },
      }),
      { status: 200 },
    );
  };
}

async function createAccessToken(
  overrides: Partial<Parameters<typeof signJwt>[0]> = {},
) {
  return signJwt(
    {
      sub: "1",
      email: "pedro@example.com",
      name: "Pedro Custodio",
      iat: 1_900_000_000,
      exp: 1_900_003_600,
      ...overrides,
    },
    JWT_SECRET,
  );
}

function createAuthRequest(
  pathname: string,
  body: string,
  contentType = "application/json",
) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: {
      "content-type": contentType,
    },
    body,
  });
}

function createAssetRequest(pathname: string, token?: string) {
  return new Request(`http://localhost${pathname}`, {
    method: "GET",
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}

function createJsonRequest(
  pathname: string,
  method: "POST" | "DELETE",
  body: unknown,
  token?: string,
) {
  return new Request(`http://localhost${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

async function seedCachedQuote(
  env: ReturnType<typeof createEnv>,
  input:
    | {
        assetType: "stock";
        symbol: string;
        updatedAt: string;
        data: {
          ticker: string;
          name: string;
          market: "B3";
          currency: string;
          price: number;
          change: number;
          changePercent: number;
          quotedAt: string;
          logoUrl: string | null;
        };
      }
    | {
        assetType: "crypto";
        symbol: string;
        updatedAt: string;
        data: {
          symbol: string;
          name: string;
          currency: string;
          price: number;
          change: number;
          changePercent: number;
          quotedAt: string;
        };
      },
) {
  const key =
    input.assetType === "stock"
      ? buildAssetQuoteCacheKey(input.symbol)
      : buildCryptoQuoteCacheKey(input.symbol);

  await env.ASSET_CACHE.put(
    key,
    JSON.stringify({
      request: {
        assetType: input.assetType,
        symbol: input.symbol,
      },
      key,
      updatedAt: input.updatedAt,
      data: input.data,
      ...(input.assetType === "stock"
        ? {
            ticker: input.symbol,
          }
        : {
            symbol: input.symbol,
          }),
    }),
  );
}

function createExecutionContext() {
  const promises: Promise<unknown>[] = [];

  return {
    ctx: {
      waitUntil(promise: Promise<unknown>) {
        promises.push(promise);
      },
      passThroughOnException() {},
      props: {},
    } as ExecutionContext,
    waitUntilPromises: promises,
    async flushWaitUntil() {
      await Promise.all(promises);
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("POST /auth/register", () => {
  it("creates the user, normalizes the email and returns a bearer token", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: "Pedro Custodio",
          email: "Pedro@Example.com ",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: {
        user: {
          id: number;
          name: string;
          email: string;
          createdAt: string;
        };
        token: string;
        tokenType: string;
        expiresIn: number;
      };
    }>();

    expect(response.status).toBe(201);
    expect(payload.data.user).toMatchObject({
      id: 1,
      name: "Pedro Custodio",
      email: "pedro@example.com",
    });
    expect(new Date(payload.data.user.createdAt).toISOString()).toBe(
      payload.data.user.createdAt,
    );
    expect(payload.data.tokenType).toBe("Bearer");
    expect(payload.data.expiresIn).toBe(3600);
    expect(payload.data.token.split(".")).toHaveLength(3);
    expect(JSON.stringify(payload)).not.toContain("password_hash");
    expect(fakeDb.getUsers()).toHaveLength(1);
    expect(fakeDb.getUsers()[0]?.email).toBe("pedro@example.com");
    expect(fakeDb.getUsers()[0]?.password_hash).toMatch(
      /^pbkdf2\$sha256\$100000\$/,
    );
  });

  it("stores and returns normalized accented names consistently", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: " Jose\u0301   A\u0301lvares ",
          email: "jose@example.com",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: {
        user: {
          name: string;
        };
      };
    }>();

    expect(response.status).toBe(201);
    expect(payload.data.user.name).toBe("José Álvares");
    expect(fakeDb.getUsers()[0]?.name).toBe("José Álvares");
    expect(fakeDb.getUsers()[0]?.name).toBe(
      fakeDb.getUsers()[0]?.name.normalize("NFC"),
    );
  });

  it("returns 409 for duplicate emails ignoring casing", async () => {
    const fakeDb = createFakeD1Database();

    fakeDb.seedUser({
      name: "Existing User",
      email: "pedro@example.com",
      password_hash: "pbkdf2$sha256$310000$salt$hash",
    });

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: "Pedro Custodio",
          email: "PEDRO@example.com",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("EMAIL_ALREADY_IN_USE");
  });

  it("returns 422 for invalid payloads", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: "P",
          email: "invalid-email",
          password: "123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: {
        code: string;
        details: {
          fieldErrors: Record<string, string[]>;
        };
      };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details.fieldErrors.name).toBeTruthy();
    expect(payload.error.details.fieldErrors.email).toBeTruthy();
    expect(payload.error.details.fieldErrors.password).toBeTruthy();
  });

  it("returns 422 when the name contains control characters", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: "Pedro\u0000Custodio",
          email: "pedro@example.com",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: {
        code: string;
        details: {
          fieldErrors: Record<string, string[]>;
        };
      };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details.fieldErrors.name).toBeTruthy();
  });

  it("returns 400 for malformed JSON", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest("/auth/register", '{"name":"Pedro"'),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_JSON");
  });

  it("returns 415 for unsupported media types", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/register",
        JSON.stringify({
          name: "Pedro Custodio",
          email: "pedro@example.com",
          password: "SenhaSegura123",
        }),
        "text/plain",
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(415);
    expect(payload.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });
});

describe("POST /auth/login", () => {
  it("logs in an existing user and returns a bearer token with the public user", async () => {
    const fakeDb = createFakeD1Database();
    const passwordHash = await hashPassword("SenhaSegura123");

    fakeDb.seedUser({
      name: "Pedro Custodio",
      email: "pedro@example.com",
      password_hash: passwordHash,
    });

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: "pedro@example.com",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: {
        user: {
          id: number;
          name: string;
          email: string;
          createdAt: string;
        };
        token: string;
        tokenType: string;
        expiresIn: number;
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.user).toMatchObject({
      id: 1,
      name: "Pedro Custodio",
      email: "pedro@example.com",
    });
    expect(new Date(payload.data.user.createdAt).toISOString()).toBe(
      payload.data.user.createdAt,
    );
    expect(payload.data.tokenType).toBe("Bearer");
    expect(payload.data.expiresIn).toBe(3600);
    expect(payload.data.token.split(".")).toHaveLength(3);
    expect(JSON.stringify(payload)).not.toContain("password_hash");
  });

  it("normalizes email casing and whitespace before lookup", async () => {
    const fakeDb = createFakeD1Database();
    const passwordHash = await hashPassword("SenhaSegura123");

    fakeDb.seedUser({
      name: "Pedro Custodio",
      email: "pedro@example.com",
      password_hash: passwordHash,
    });

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: " Pedro@Example.com ",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );

    expect(response.status).toBe(200);
  });

  it("returns 401 for unknown emails", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: "pedro@example.com",
          password: "SenhaSegura123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: { code: string; message: string };
    }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_CREDENTIALS");
    expect(payload.error.message).toBe("E-mail ou senha inválidos");
  });

  it("returns 401 for wrong passwords", async () => {
    const fakeDb = createFakeD1Database();
    const passwordHash = await hashPassword("SenhaSegura123");

    fakeDb.seedUser({
      name: "Pedro Custodio",
      email: "pedro@example.com",
      password_hash: passwordHash,
    });

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: "pedro@example.com",
          password: "SenhaErrada123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 422 for invalid payloads", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: "invalid-email",
          password: "123",
        }),
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: {
        code: string;
        details: {
          fieldErrors: Record<string, string[]>;
        };
      };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details.fieldErrors.email).toBeTruthy();
    expect(payload.error.details.fieldErrors.password).toBeTruthy();
  });

  it("returns 400 for malformed JSON", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest("/auth/login", '{"email":"pedro@example.com"'),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_JSON");
  });

  it("returns 415 for unsupported media types", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAuthRequest(
        "/auth/login",
        JSON.stringify({
          email: "pedro@example.com",
          password: "SenhaSegura123",
        }),
        "text/plain",
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(415);
    expect(payload.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });
});

describe("documentation routes", () => {
  it("serves the OpenAPI document", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      new Request("http://localhost/openapi.json"),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      openapi: string;
      paths: Record<string, unknown>;
      servers: Array<{ url: string }>;
    }>();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(payload.openapi).toBe("3.1.1");
    expect(payload.paths["/auth/login"]).toBeTruthy();
    expect(payload.paths["/auth/register"]).toBeTruthy();
    expect(payload.paths["/ativos/{ticker}"]).toBeTruthy();
    expect(payload.paths["/ativos"]).toBeUndefined();
    const assetPath = payload.paths["/ativos/{ticker}"] as {
      get?: {
        responses?: {
          "200"?: {
            content?: {
              "application/json"?: {
                schema?: {
                  oneOf?: unknown[];
                };
              };
            };
          };
        };
      };
    };
    expect(
      assetPath.get?.responses?.["200"]?.content?.["application/json"]?.schema
        ?.oneOf,
    ).toHaveLength(2);
    expect(payload.servers[0]?.url).toBe("http://localhost");
  });

  it("serves Swagger UI HTML", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      new Request("http://localhost/docs"),
      createEnv(fakeDb),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("swagger-ui");
    expect(html).toContain("http://localhost/openapi.json");
  });
});

describe("GET /ativos/:ticker", () => {
  it("creates B3 cache on the first lookup and returns cache metadata", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: "PETR4",
              longName: "Petroleo Brasileiro S.A. Petrobras",
              currency: "BRL",
              regularMarketPrice: 38.42,
              regularMarketChange: -0.18,
              regularMarketChangePercent: -0.47,
              regularMarketTime: 1_741_632_000,
              logourl: "https://example.com/petr4.png",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/petr4", token),
      env,
    );
    const payload = await response.json<{
      data: {
        ticker: string;
        logoUrl: string | null;
        market: string;
        currency: string;
        quotedAt: string;
      };
      cache: {
        key: string;
        stale: boolean;
        source: string;
        updatedAt: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.ticker).toBe("PETR4");
    expect(payload.data.market).toBe("B3");
    expect(payload.data.currency).toBe("BRL");
    expect(payload.data.logoUrl).toBe("https://example.com/petr4.png");
    expect(payload.data.quotedAt).toBe("2025-03-10T18:40:00.000Z");
    expect(payload.cache.key).toBe("asset-quote:v1:PETR4");
    expect(payload.cache.stale).toBe(false);
    expect(payload.cache.source).toBe("live");
    expect(payload.cache.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(
      JSON.parse(env.ASSET_CACHE.readRaw("asset-quote:v1:PETR4") ?? "{}"),
    ).toMatchObject({
      ticker: "PETR4",
      data: expect.objectContaining({
        ticker: "PETR4",
      }),
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://brapi.dev/api/quote/PETR4",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: `Bearer ${BRAPI_TOKEN}`,
        }),
      }),
    );
  });

  it("serves a repeated B3 lookup from KV without calling brapi again", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: "PETR4",
              longName: "Petrobras",
              regularMarketPrice: 38.42,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await worker.fetch(createAssetRequest("/ativos/PETR4", token), env);
    const secondResponse = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      env,
    );
    const payload = await secondResponse.json<{ cache: { source: string } }>();

    expect(secondResponse.status).toBe(200);
    expect(payload.cache.source).toBe("cache");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns stale B3 cache immediately and refreshes it in the background", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const { ctx, flushWaitUntil } = createExecutionContext();

    await env.ASSET_CACHE.put(
      "asset-quote:v1:PETR4",
      JSON.stringify({
        ticker: "PETR4",
        updatedAt: "2020-03-10T18:00:00.000Z",
        data: {
          ticker: "PETR4",
          name: "Petrobras",
          market: "B3",
          currency: "BRL",
          price: 10,
          change: 1,
          changePercent: 2,
          quotedAt: "2026-03-10T18:00:00.000Z",
          logoUrl: null,
        },
      }),
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            { symbol: "PETR4", longName: "Petrobras", regularMarketPrice: 999 },
          ],
        }),
        { status: 200 },
      ),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      env,
      ctx,
    );
    const payload = await response.json<{
      data: { price: number };
      cache: { stale: boolean; source: string };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.price).toBe(10);
    expect(payload.cache.stale).toBe(true);
    expect(payload.cache.source).toBe("cache");

    await flushWaitUntil();

    expect(
      JSON.parse(env.ASSET_CACHE.readRaw("asset-quote:v1:PETR4") ?? "{}"),
    ).toMatchObject({
      data: expect.objectContaining({ price: 999 }),
    });
  });

  it("avoids duplicate B3 refreshes while the lock is held", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const firstCtx = createExecutionContext();
    const secondCtx = createExecutionContext();
    let resolveRefresh: () => void = () => {
      throw new Error("Refresh resolver was not set");
    };

    await env.ASSET_CACHE.put(
      "asset-quote:v1:PETR4",
      JSON.stringify({
        ticker: "PETR4",
        updatedAt: "2020-03-10T18:00:00.000Z",
        data: {
          ticker: "PETR4",
          name: "Petrobras",
          market: "B3",
          currency: "BRL",
          price: 10,
          change: 0,
          changePercent: 0,
          quotedAt: "2026-03-10T18:00:00.000Z",
          logoUrl: null,
        },
      }),
    );

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = () => {
            resolve(
              new Response(
                JSON.stringify({
                  results: [
                    {
                      symbol: "PETR4",
                      longName: "Petrobras",
                      regularMarketPrice: 321,
                    },
                  ],
                }),
                { status: 200 },
              ),
            );
          };
        }),
    );

    const firstResponse = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      env,
      firstCtx.ctx,
    );
    const secondResponse = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      env,
      secondCtx.ctx,
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(env.ASSET_CACHE.readRaw("asset-quote-lock:v1:PETR4")).toBe("1");

    resolveRefresh();
    await firstCtx.flushWaitUntil();
    await secondCtx.flushWaitUntil();

    expect(env.ASSET_CACHE.readRaw("asset-quote-lock:v1:PETR4")).toBeNull();
  });

  it("returns logoUrl as null when the provider logo is empty", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: "VALE3",
              shortName: "Vale",
              regularMarketPrice: 55.2,
              regularMarketChange: 0.12,
              regularMarketChangePercent: 0.21,
              regularMarketTime: "2026-03-10T18:00:00.000Z",
              logourl: "   ",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/vale3", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: { logoUrl: string | null; currency: string };
      cache: { source: string };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.logoUrl).toBeNull();
    expect(payload.data.currency).toBe("BRL");
    expect(payload.cache.source).toBe("live");
  });

  it("returns 401 when the bearer token is missing", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4"),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 401 when the token is invalid", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4", "not-a-jwt"),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 401 when the token is expired", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken({
      exp: 1,
    });

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 422 for invalid tickers", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4.SA1", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: { code: string; message: string };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.message).toBe("Ticker do ativo inválido");
  });

  it("returns 404 when the asset does not exist", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/ABCD1", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("ASSET_NOT_FOUND");
  });

  it("returns 502 when the asset provider fails", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream error", { status: 500 }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("EXTERNAL_SERVICE_ERROR");
  });

  it("returns 502 when the asset provider times out", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Timed out", "AbortError"),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: { code: string; message: string };
    }>();

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("EXTERNAL_SERVICE_ERROR");
    expect(payload.error.message).toBe("A requisição ao provedor de ativos expirou");
  });
});

describe("GET /ativos/:ticker?type=crypto", () => {
  it("creates crypto cache on the first lookup and returns cache metadata", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        createCoinCapFetchImplementation({
          BTC: {
            name: "Bitcoin",
            priceUsd: "30.99",
            changePercent24Hr: "1.37",
          },
        }),
      );

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
    );
    const payload = await response.json<{
      data: { symbol: string; currency: string; quotedAt: string };
      cache: { key: string; stale: boolean; source: string };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.symbol).toBe("BTC");
    expect(payload.data.currency).toBe("USD");
    expect(payload.data.quotedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.cache.key).toBe("crypto-quote:v1:BTC");
    expect(payload.cache.stale).toBe(false);
    expect(payload.cache.source).toBe("live");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://rest.coincap.io/v3/assets?search=BTC",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${COINCAP_API_KEY}`,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://rest.coincap.io/v3/assets/btc",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${COINCAP_API_KEY}`,
        }),
      }),
    );
    expect(
      JSON.parse(env.ASSET_CACHE.readRaw("crypto-quote:v1:BTC") ?? "{}"),
    ).toMatchObject({
      symbol: "BTC",
      data: expect.objectContaining({ symbol: "BTC" }),
    });
  });

  it("serves repeated crypto lookups from KV and isolates cache by symbol", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        createCoinCapFetchImplementation({
          BTC: { name: "Bitcoin", priceUsd: "88432.15", changePercent24Hr: "1.43" },
          ETH: { name: "Ethereum", priceUsd: "2201.50", changePercent24Hr: "-0.75" },
        }),
      );

    await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
    );
    const secondBtc = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
    );
    await worker.fetch(
      createAssetRequest("/ativos/ETH?type=crypto", token),
      env,
    );
    const payload = await secondBtc.json<{ cache: { source: string } }>();

    expect(secondBtc.status).toBe(200);
    expect(payload.cache.source).toBe("cache");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(env.ASSET_CACHE.readRaw("crypto-quote:v1:BTC")).toBeTruthy();
    expect(env.ASSET_CACHE.readRaw("crypto-quote:v1:ETH")).toBeTruthy();
  });

  it("returns stale crypto cache immediately and refreshes it in the background", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const { ctx, flushWaitUntil } = createExecutionContext();

    await env.ASSET_CACHE.put(
      "crypto-quote:v1:BTC",
      JSON.stringify({
        symbol: "BTC",
        updatedAt: "2020-03-10T18:00:00.000Z",
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 10,
          change: 1,
          changePercent: 2,
          quotedAt: "2026-03-10T18:00:00.000Z",
        },
      }),
    );

    vi.spyOn(globalThis, "fetch").mockImplementation(
      createCoinCapFetchImplementation({
        BTC: {
          name: "Bitcoin",
          priceUsd: "999",
          changePercent24Hr: "0",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
      ctx,
    );
    const payload = await response.json<{
      data: { price: number };
      cache: { stale: boolean; source: string };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.price).toBe(10);
    expect(payload.cache.stale).toBe(true);
    expect(payload.cache.source).toBe("cache");

    await flushWaitUntil();

    expect(
      JSON.parse(env.ASSET_CACHE.readRaw("crypto-quote:v1:BTC") ?? "{}"),
    ).toMatchObject({
      data: expect.objectContaining({ price: 999 }),
    });
  });

  it("avoids duplicate crypto refreshes while the lock is held", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const firstCtx = createExecutionContext();
    const secondCtx = createExecutionContext();
    let resolveRefresh: () => void = () => {
      throw new Error("Refresh resolver was not set");
    };

    await env.ASSET_CACHE.put(
      "crypto-quote:v1:BTC",
      JSON.stringify({
        symbol: "BTC",
        updatedAt: "2020-03-10T18:00:00.000Z",
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 10,
          change: 0,
          changePercent: 0,
          quotedAt: "2026-03-10T18:00:00.000Z",
        },
      }),
    );

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input) => {
        const url = String(input);

        if (url.includes("/v3/assets?search=BTC")) {
          return new Response(
            JSON.stringify({
              data: [{ id: "btc", symbol: "BTC", name: "Bitcoin" }],
            }),
            { status: 200 },
          );
        }

        if (url.endsWith("/v3/assets/btc")) {
          return new Promise<Response>((resolve) => {
            resolveRefresh = () => {
              resolve(
                new Response(
                  JSON.stringify({
                    data: {
                      id: "btc",
                      symbol: "BTC",
                      name: "Bitcoin",
                      priceUsd: "321",
                      changePercent24Hr: "0",
                    },
                  }),
                  { status: 200 },
                ),
              );
            };
          });
        }

        throw new Error(`Unexpected URL ${url}`);
      },
    );

    const firstResponse = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
      firstCtx.ctx,
    );
    const secondResponse = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      env,
      secondCtx.ctx,
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(env.ASSET_CACHE.readRaw("crypto-quote-lock:v1:BTC")).toBe("1");

    resolveRefresh();
    await firstCtx.flushWaitUntil();
    await secondCtx.flushWaitUntil();

    expect(env.ASSET_CACHE.readRaw("crypto-quote-lock:v1:BTC")).toBeNull();
  });

  it("returns 401 without a token", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto"),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 422 for invalid crypto type and symbol", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const invalidType = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=stock", token),
      createEnv(fakeDb),
    );
    const invalidSymbol = await worker.fetch(
      createAssetRequest("/ativos/B/?type=crypto", token),
      createEnv(fakeDb),
    );

    expect(invalidType.status).toBe(422);
    expect(invalidSymbol.status).toBe(422);
  });

  it("returns 404 when the crypto asset does not exist", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("ASSET_NOT_FOUND");
  });

  it("returns 502 when the crypto provider fails", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/v3/assets?search=BTC")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "btc", symbol: "BTC", name: "Bitcoin" }],
          }),
          { status: 200 },
        );
      }

      return new Response("upstream error", { status: 500 });
    });

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC?type=crypto", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("EXTERNAL_SERVICE_ERROR");
  });
});

describe("GET /ativos legacy search route", () => {
  it("does not expose the removed crypto search contract anymore", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/ativos?type=crypto&search=btc", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /ativos/:ticker/cache", () => {
  it("returns 200 for a cached stock quote without calling fetch", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await env.ASSET_CACHE.put(
      buildAssetQuoteCacheKey("PETR4"),
      JSON.stringify({
        ticker: "PETR4",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          ticker: "PETR4",
          name: "Petroleo Brasileiro S.A. Petrobras",
          market: "B3",
          currency: "BRL",
          price: 37.42,
          change: 0.85,
          changePercent: 2.32,
          quotedAt: "2026-03-11T14:30:00.000Z",
          logoUrl: "https://example.com/petr4.png",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/petr4/cache", token),
      env,
    );
    const payload = await response.json<{
      data: {
        ticker: string;
      };
      cache: {
        source: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.ticker).toBe("PETR4");
    expect(payload.cache.source).toBe("cache");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 200 for a cached crypto quote without calling fetch", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await env.ASSET_CACHE.put(
      buildCryptoQuoteCacheKey("BTC"),
      JSON.stringify({
        symbol: "BTC",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 88_432.15,
          change: 1_250.5,
          changePercent: 1.43,
          quotedAt: "2026-03-11T14:30:00.000Z",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/BTC/cache?type=crypto", token),
      env,
    );
    const payload = await response.json<{
      data: {
        symbol: string;
      };
      cache: {
        source: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.symbol).toBe("BTC");
    expect(payload.cache.source).toBe("cache");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 404 ASSET_CACHE_MISS when KV has no entry", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/ativos/PETR4/cache", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("ASSET_CACHE_MISS");
  });
});

describe("GET /ativos/cache-search", () => {
  it("returns partial stock matches from KV", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();

    await env.ASSET_CACHE.put(
      buildAssetQuoteCacheKey("PETR4"),
      JSON.stringify({
        ticker: "PETR4",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          ticker: "PETR4",
          name: "Petroleo Brasileiro S.A. Petrobras",
          market: "B3",
          currency: "BRL",
          price: 37.42,
          change: 0.85,
          changePercent: 2.32,
          quotedAt: "2026-03-11T14:30:00.000Z",
          logoUrl: "https://example.com/petr4.png",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/cache-search?q=pet", token),
      env,
    );
    const payload = await response.json<{
      data: Array<{
        data: {
          ticker: string;
        };
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]?.data.ticker).toBe("PETR4");
  });

  it("returns partial crypto matches from KV", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();

    await env.ASSET_CACHE.put(
      buildCryptoQuoteCacheKey("BTC"),
      JSON.stringify({
        symbol: "BTC",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 88_432.15,
          change: 1_250.5,
          changePercent: 1.43,
          quotedAt: "2026-03-11T14:30:00.000Z",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/cache-search?q=bt&type=crypto", token),
      env,
    );
    const payload = await response.json<{
      data: Array<{
        data: {
          symbol: string;
        };
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]?.data.symbol).toBe("BTC");
  });

  it("keeps crypto cache-search KV-only without calling providers", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await env.ASSET_CACHE.put(
      buildCryptoQuoteCacheKey("BTC"),
      JSON.stringify({
        symbol: "BTC",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          symbol: "BTC",
          name: "Bitcoin",
          currency: "USD",
          price: 88_432.15,
          change: 1_250.5,
          changePercent: 1.43,
          quotedAt: "2026-03-11T14:30:00.000Z",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/cache-search?q=bt&type=crypto", token),
      env,
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid stock prefixes", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/ativos/cache-search?q=petr4.sa1", token),
      createEnv(fakeDb),
    );

    expect(response.status).toBe(422);
  });

  it("accepts suffixed stock prefixes", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const token = await createAccessToken();

    await env.ASSET_CACHE.put(
      buildAssetQuoteCacheKey("AAPL34.SA"),
      JSON.stringify({
        ticker: "AAPL34.SA",
        updatedAt: "2026-03-11T14:30:00.000Z",
        data: {
          ticker: "AAPL34.SA",
          name: "Apple Inc BDR",
          market: "B3",
          currency: "BRL",
          price: 52.14,
          change: 0.41,
          changePercent: 0.79,
          quotedAt: "2026-03-11T14:30:00.000Z",
          logoUrl: "https://example.com/aapl34.png",
        },
      }),
    );

    const response = await worker.fetch(
      createAssetRequest("/ativos/cache-search?q=aapl34.s", token),
      env,
    );
    const payload = await response.json<{
      data: Array<{
        data: {
          ticker: string;
        };
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]?.data.ticker).toBe("AAPL34.SA");
  });
});

describe("recent asset selections", () => {
  it("returns an empty array for a new user", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/users/me/recent-assets", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ data: unknown[] }>();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual([]);
  });

  it("stores the first selection", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "PETR4",
          type: "stock",
          label: "Petroleo Brasileiro S.A. Petrobras",
          market: "B3",
          currency: "BRL",
          logoUrl: "https://example.com/petr4.png",
        },
        token,
      ),
      env,
    );

    expect(response.status).toBe(204);
    expect(fakeDb.getRecentSelections()).toHaveLength(1);
    expect(fakeDb.getRecentSelections()[0]).toMatchObject({
      symbol: "PETR4",
      asset_type: "stock",
      logo_url: "https://example.com/petr4.png",
    });
    expect(fakeDb.getUserActivityEvents()).toHaveLength(1);
    expect(fakeDb.getUserActivityEvents()[0]).toMatchObject({
      event_type: "asset_viewed",
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petroleo Brasileiro S.A. Petrobras",
    });
  });

  it("updates timestamp instead of duplicating a repeated selection", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);

    await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "BTC",
          type: "crypto",
          label: "Bitcoin",
          currency: "USD",
        },
        token,
      ),
      env,
    );

    await new Promise((resolve) => setTimeout(resolve, 5));

    await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "btc",
          type: "crypto",
          label: "Bitcoin",
          currency: "USD",
        },
        token,
      ),
      env,
    );

    expect(fakeDb.getRecentSelections()).toHaveLength(1);
    expect(fakeDb.getRecentSelections()[0]?.symbol).toBe("BTC");
  });

  it("trims the oldest item after the sixth selection", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);
    const selections = ["PETR4", "VALE3", "ITUB4", "WEGE3", "ABEV3", "BBAS3"];

    for (const symbol of selections) {
      await worker.fetch(
        createJsonRequest(
          "/users/me/recent-assets",
          "POST",
          {
            symbol,
            type: "stock",
            label: symbol,
            market: "B3",
            currency: "BRL",
          },
          token,
        ),
        env,
      );
    }

    const response = await worker.fetch(
      createAssetRequest("/users/me/recent-assets", token),
      env,
    );
    const payload = await response.json<{
      data: Array<{
        symbol: string;
      }>;
    }>();

    expect(payload.data).toHaveLength(5);
    expect(payload.data.map((item) => item.symbol)).toEqual([
      "BBAS3",
      "ABEV3",
      "WEGE3",
      "ITUB4",
      "VALE3",
    ]);
  });

  it("keeps recents isolated per user", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const firstToken = await createAccessToken({ sub: "1" });
    const secondToken = await createAccessToken({
      sub: "2",
      email: "maria@example.com",
      name: "Maria",
    });

    await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "PETR4",
          type: "stock",
          label: "Petrobras",
          market: "B3",
          currency: "BRL",
          logoUrl: "https://example.com/petr4.png",
        },
        firstToken,
      ),
      env,
    );

    await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "BTC",
          type: "crypto",
          label: "Bitcoin",
          currency: "USD",
        },
        secondToken,
      ),
      env,
    );

    const firstResponse = await worker.fetch(
      createAssetRequest("/users/me/recent-assets", firstToken),
      env,
    );
    const secondResponse = await worker.fetch(
      createAssetRequest("/users/me/recent-assets", secondToken),
      env,
    );
    const firstPayload = await firstResponse.json<{
      data: Array<{ symbol: string }>;
    }>();
    const secondPayload = await secondResponse.json<{
      data: Array<{ symbol: string }>;
    }>();

    expect(firstPayload.data.map((item) => item.symbol)).toEqual(["PETR4"]);
    expect(secondPayload.data.map((item) => item.symbol)).toEqual(["BTC"]);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const fakeDb = createFakeD1Database();

    const getResponse = await worker.fetch(
      createAssetRequest("/users/me/recent-assets"),
      createEnv(fakeDb),
    );
    const postResponse = await worker.fetch(
      createJsonRequest("/users/me/recent-assets", "POST", {
        symbol: "PETR4",
        type: "stock",
        label: "Petrobras",
        market: "B3",
        currency: "BRL",
      }),
      createEnv(fakeDb),
    );

    expect(getResponse.status).toBe(401);
    expect(postResponse.status).toBe(401);
  });

  it("returns 422 for invalid payloads", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/recent-assets",
        "POST",
        {
          symbol: "PE",
          type: "bond",
          label: "",
        },
        token,
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: {
        code: string;
        details?: {
          fieldErrors?: Record<string, string[]>;
        };
      };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details?.fieldErrors).toBeTruthy();
  });
});

describe("favorite assets", () => {
  it("returns an empty array for a user without favorites", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/users/me/favorites", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ data: unknown[] }>();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual([]);
  });

  it("returns favorites ordered by descending favoritedAt", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      market: "B3",
      currency: "BRL",
      logo_url: "https://example.com/petr4.png",
      created_at: "2026-03-18T12:00:00.000Z",
    });
    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "BTC",
      asset_type: "crypto",
      label: "Bitcoin",
      market: null,
      currency: "USD",
      logo_url: null,
      created_at: "2026-03-18T12:05:00.000Z",
    });

    const response = await worker.fetch(
      createAssetRequest("/users/me/favorites", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: Array<{
        symbol: string;
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.map((item) => item.symbol)).toEqual(["BTC", "PETR4"]);
  });

  it("isolates favorites by user", async () => {
    const fakeDb = createFakeD1Database();
    const env = createEnv(fakeDb);
    const firstToken = await createAccessToken({ sub: "1" });
    const secondToken = await createAccessToken({
      sub: "2",
      email: "maria@example.com",
      name: "Maria",
    });

    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      market: "B3",
      currency: "BRL",
      logo_url: "https://example.com/petr4.png",
      created_at: "2026-03-18T12:00:00.000Z",
    });
    fakeDb.seedFavoriteAsset({
      user_id: 2,
      symbol: "BTC",
      asset_type: "crypto",
      label: "Bitcoin",
      market: null,
      currency: "USD",
      logo_url: null,
      created_at: "2026-03-18T12:01:00.000Z",
    });

    const firstResponse = await worker.fetch(
      createAssetRequest("/users/me/favorites", firstToken),
      env,
    );
    const secondResponse = await worker.fetch(
      createAssetRequest("/users/me/favorites", secondToken),
      env,
    );
    const firstPayload = await firstResponse.json<{
      data: Array<{ symbol: string }>;
    }>();
    const secondPayload = await secondResponse.json<{
      data: Array<{ symbol: string }>;
    }>();

    expect(firstPayload.data.map((item) => item.symbol)).toEqual(["PETR4"]);
    expect(secondPayload.data.map((item) => item.symbol)).toEqual(["BTC"]);
  });

  it("serializes type, logoUrl and favoritedAt correctly", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "BTC",
      asset_type: "crypto",
      label: "Bitcoin",
      market: null,
      currency: "USD",
      logo_url: null,
      created_at: "2026-03-18T12:00:00.000Z",
    });

    const response = await worker.fetch(
      createAssetRequest("/users/me/favorites", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: Array<{
        symbol: string;
        type: string;
        logoUrl: string | null;
        favoritedAt: string;
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(payload.data[0]).toMatchObject({
      symbol: "BTC",
      type: "crypto",
      logoUrl: null,
      favoritedAt: "2026-03-18T12:00:00.000Z",
    });
  });

  it("returns 401 without authentication", async () => {
    const fakeDb = createFakeD1Database();

    const response = await worker.fetch(
      createAssetRequest("/users/me/favorites"),
      createEnv(fakeDb),
    );
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("stores a new favorite and records the corresponding activity", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              symbol: "PETR4",
              longName: "Petrobras PN",
              regularMarketPrice: 38.42,
              regularMarketChange: 0.52,
              regularMarketChangePercent: 1.37,
              regularMarketTime: 1_742_483_400,
              logourl: "https://example.com/petr4.png",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/favorites",
        "POST",
        {
          symbol: "PETR4",
          type: "stock",
        },
        token,
      ),
      env,
    );

    expect(response.status).toBe(204);
    expect(fakeDb.getFavoriteAssets()).toHaveLength(1);
    expect(fakeDb.getFavoriteAssets()[0]).toMatchObject({
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
    });
    expect(fakeDb.getUserActivityEvents()).toContainEqual(
      expect.objectContaining({
        event_type: "favorite_added",
        symbol: "PETR4",
        asset_type: "stock",
        label: "Petrobras PN",
      }),
    );
  });

  it("removes an existing favorite and records the removal activity", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);

    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      market: "B3",
      currency: "BRL",
      logo_url: "https://example.com/petr4.png",
      created_at: "2026-03-18T12:00:00.000Z",
    });

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/favorites",
        "DELETE",
        {
          symbol: "petr4",
          type: "stock",
        },
        token,
      ),
      env,
    );

    expect(response.status).toBe(204);
    expect(fakeDb.getFavoriteAssets()).toEqual([]);
    expect(fakeDb.getUserActivityEvents()).toContainEqual(
      expect.objectContaining({
        event_type: "favorite_removed",
        symbol: "PETR4",
        asset_type: "stock",
        label: "Petrobras PN",
      }),
    );
  });
});

describe("user activity", () => {
  it("records debounced searches with normalized query and type", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/activity/searches",
        "POST",
        {
          query: " petr ",
          type: "stock",
        },
        token,
      ),
      createEnv(fakeDb),
    );

    expect(response.status).toBe(204);
    expect(fakeDb.getUserActivityEvents()).toContainEqual(
      expect.objectContaining({
        event_type: "search_performed",
        asset_type: "stock",
        search_query: "PETR",
      }),
    );
  });

  it("rejects invalid search activity payloads", async () => {
    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createJsonRequest(
        "/users/me/activity/searches",
        "POST",
        {
          query: "",
          type: "bond",
        },
        token,
      ),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      error: {
        code: string;
      };
    }>();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /users/me/dashboard", () => {
  it("returns stats, recent activity, recent selections and fresh cache movers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T15:00:00.000Z"));

    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();
    const env = createEnv(fakeDb);

    fakeDb.seedFavoriteAsset({
      user_id: 1,
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      market: "B3",
      currency: "BRL",
      logo_url: "https://example.com/petr4.png",
      created_at: "2026-03-20T14:15:00.000Z",
    });
    fakeDb.seedRecentSelection({
      user_id: 1,
      symbol: "BTC",
      asset_type: "crypto",
      label: "Bitcoin",
      market: null,
      currency: "USD",
      logo_url: null,
      last_selected_at: "2026-03-20T14:45:00.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "search_performed",
      symbol: null,
      asset_type: "stock",
      label: null,
      search_query: "PETR",
      created_at: "2026-03-20T03:05:00.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "search_performed",
      symbol: null,
      asset_type: "crypto",
      label: null,
      search_query: "BTC",
      created_at: "2026-03-20T14:00:00.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "search_performed",
      symbol: null,
      asset_type: "stock",
      label: null,
      search_query: "VALE",
      created_at: "2026-03-20T02:59:59.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "asset_viewed",
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      search_query: null,
      created_at: "2026-03-20T03:10:00.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "asset_viewed",
      symbol: "BTC",
      asset_type: "crypto",
      label: "Bitcoin",
      search_query: null,
      created_at: "2026-03-20T14:30:00.000Z",
    });
    fakeDb.seedUserActivityEvent({
      user_id: 1,
      event_type: "favorite_added",
      symbol: "PETR4",
      asset_type: "stock",
      label: "Petrobras PN",
      search_query: null,
      created_at: "2026-03-20T14:35:00.000Z",
    });

    await seedCachedQuote(env, {
      assetType: "stock",
      symbol: "PETR4",
      updatedAt: "2026-03-20T14:59:00.000Z",
      data: {
        ticker: "PETR4",
        name: "Petrobras PN",
        market: "B3",
        currency: "BRL",
        price: 38.42,
        change: 1.5,
        changePercent: 4.1,
        quotedAt: "2026-03-20T14:59:00.000Z",
        logoUrl: "https://example.com/petr4.png",
      },
    });
    await seedCachedQuote(env, {
      assetType: "crypto",
      symbol: "BTC",
      updatedAt: "2026-03-20T14:58:00.000Z",
      data: {
        symbol: "BTC",
        name: "Bitcoin",
        currency: "USD",
        price: 67432.18,
        change: 1245.67,
        changePercent: 1.88,
        quotedAt: "2026-03-20T14:58:00.000Z",
      },
    });
    await seedCachedQuote(env, {
      assetType: "stock",
      symbol: "VALE3",
      updatedAt: "2026-03-20T14:57:00.000Z",
      data: {
        ticker: "VALE3",
        name: "Vale ON",
        market: "B3",
        currency: "BRL",
        price: 62.14,
        change: -2.31,
        changePercent: -3.59,
        quotedAt: "2026-03-20T14:57:00.000Z",
        logoUrl: null,
      },
    });
    await seedCachedQuote(env, {
      assetType: "crypto",
      symbol: "ETH",
      updatedAt: "2026-03-20T14:56:00.000Z",
      data: {
        symbol: "ETH",
        name: "Ethereum",
        currency: "USD",
        price: 3421.56,
        change: -89.23,
        changePercent: -2.68,
        quotedAt: "2026-03-20T14:56:00.000Z",
      },
    });
    await seedCachedQuote(env, {
      assetType: "stock",
      symbol: "ABEV3",
      updatedAt: "2026-03-20T14:40:00.000Z",
      data: {
        ticker: "ABEV3",
        name: "Ambev",
        market: "B3",
        currency: "BRL",
        price: 12.45,
        change: 1.34,
        changePercent: 9.0,
        quotedAt: "2026-03-20T14:40:00.000Z",
        logoUrl: null,
      },
    });

    const response = await worker.fetch(
      createAssetRequest("/users/me/dashboard", token),
      env,
    );
    const payload = await response.json<{
      data: {
        stats: {
          favoritesCount: number;
          searchesToday: number;
          viewsToday: number;
        };
        recentSelections: Array<{ symbol: string }>;
        activityTimeline: Array<{
          type: string;
          symbol: string | null;
          searchQuery: string | null;
        }>;
        marketMovers: {
          gainers: Array<{ symbol: string; type: string }>;
          losers: Array<{ symbol: string; type: string }>;
        };
        generatedAt: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.stats).toEqual({
      favoritesCount: 1,
      searchesToday: 2,
      viewsToday: 2,
    });
    expect(payload.data.recentSelections).toEqual([
      expect.objectContaining({ symbol: "BTC" }),
    ]);
    expect(payload.data.activityTimeline[0]).toEqual(
      expect.objectContaining({
        type: "favorite_added",
        symbol: "PETR4",
      }),
    );
    expect(payload.data.activityTimeline).toContainEqual(
      expect.objectContaining({
        type: "search_performed",
        searchQuery: "BTC",
      }),
    );
    expect(payload.data.marketMovers.gainers).toEqual([
      expect.objectContaining({ symbol: "PETR4", type: "stock" }),
      expect.objectContaining({ symbol: "BTC", type: "crypto" }),
    ]);
    expect(payload.data.marketMovers.losers).toEqual([
      expect.objectContaining({ symbol: "VALE3", type: "stock" }),
      expect.objectContaining({ symbol: "ETH", type: "crypto" }),
    ]);
    expect(
      payload.data.marketMovers.gainers.some((item) => item.symbol === "ABEV3"),
    ).toBe(false);
    expect(payload.data.generatedAt).toBe("2026-03-20T15:00:00.000Z");
  });

  it("returns empty sections when the user has no persisted data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T15:00:00.000Z"));

    const fakeDb = createFakeD1Database();
    const token = await createAccessToken();

    const response = await worker.fetch(
      createAssetRequest("/users/me/dashboard", token),
      createEnv(fakeDb),
    );
    const payload = await response.json<{
      data: {
        stats: {
          favoritesCount: number;
          searchesToday: number;
          viewsToday: number;
        };
        recentSelections: unknown[];
        activityTimeline: unknown[];
        marketMovers: {
          gainers: unknown[];
          losers: unknown[];
        };
      };
    }>();

    expect(response.status).toBe(200);
    expect(payload.data.stats).toEqual({
      favoritesCount: 0,
      searchesToday: 0,
      viewsToday: 0,
    });
    expect(payload.data.recentSelections).toEqual([]);
    expect(payload.data.activityTimeline).toEqual([]);
    expect(payload.data.marketMovers).toEqual({
      gainers: [],
      losers: [],
    });
  });
});
