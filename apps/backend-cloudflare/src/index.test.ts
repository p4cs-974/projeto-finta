import { afterEach, describe, expect, it, vi } from "vitest";

import worker from "./index";
import { signJwt } from "./lib/jwt";
import { hashPassword } from "./lib/password";
import { createFakeD1Database } from "./test/fake-d1";
import { createFakeKvNamespace } from "./test/fake-kv";

const JWT_SECRET = "test-secret";
const BRAPI_TOKEN = "brapi-test-token";

function createEnv(fakeDb: ReturnType<typeof createFakeD1Database>) {
	return {
		DB: fakeDb.db,
		JWT_SECRET,
		BRAPI_TOKEN,
		ASSET_CACHE: createFakeKvNamespace(),
	};
}

async function createAccessToken(overrides: Partial<Parameters<typeof signJwt>[0]> = {}) {
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

function createAuthRequest(pathname: string, body: string, contentType = "application/json") {
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
		expect(new Date(payload.data.user.createdAt).toISOString()).toBe(payload.data.user.createdAt);
		expect(payload.data.tokenType).toBe("Bearer");
		expect(payload.data.expiresIn).toBe(3600);
		expect(payload.data.token.split(".")).toHaveLength(3);
		expect(JSON.stringify(payload)).not.toContain("password_hash");
		expect(fakeDb.getUsers()).toHaveLength(1);
		expect(fakeDb.getUsers()[0]?.email).toBe("pedro@example.com");
		expect(fakeDb.getUsers()[0]?.password_hash).toMatch(/^pbkdf2\$sha256\$100000\$/);
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
		expect(fakeDb.getUsers()[0]?.name).toBe(fakeDb.getUsers()[0]?.name.normalize("NFC"));
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
		expect(new Date(payload.data.user.createdAt).toISOString()).toBe(payload.data.user.createdAt);
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
		const payload = await response.json<{ error: { code: string; message: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_CREDENTIALS");
		expect(payload.error.message).toBe("Invalid email or password");
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

		const response = await worker.fetch(new Request("http://localhost/openapi.json"), createEnv(fakeDb));
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
		expect(assetPath.get?.responses?.["200"]?.content?.["application/json"]?.schema?.oneOf).toHaveLength(2);
		expect(payload.servers[0]?.url).toBe("http://localhost");
	});

	it("serves Swagger UI HTML", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(new Request("http://localhost/docs"), createEnv(fakeDb));
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

		const response = await worker.fetch(createAssetRequest("/ativos/petr4", token), env);
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
		expect(JSON.parse(env.ASSET_CACHE.readRaw("asset-quote:v1:PETR4") ?? "{}")).toMatchObject({
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
					results: [{ symbol: "PETR4", longName: "Petrobras", regularMarketPrice: 38.42 }],
				}),
				{ status: 200 },
			),
		);

		await worker.fetch(createAssetRequest("/ativos/PETR4", token), env);
		const secondResponse = await worker.fetch(createAssetRequest("/ativos/PETR4", token), env);
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
					results: [{ symbol: "PETR4", longName: "Petrobras", regularMarketPrice: 999 }],
				}),
				{ status: 200 },
			),
		);

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4", token), env, ctx);
		const payload = await response.json<{ data: { price: number }; cache: { stale: boolean; source: string } }>();

		expect(response.status).toBe(200);
		expect(payload.data.price).toBe(10);
		expect(payload.cache.stale).toBe(true);
		expect(payload.cache.source).toBe("cache");

		await flushWaitUntil();

		expect(JSON.parse(env.ASSET_CACHE.readRaw("asset-quote:v1:PETR4") ?? "{}")).toMatchObject({
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
									results: [{ symbol: "PETR4", longName: "Petrobras", regularMarketPrice: 321 }],
								}),
								{ status: 200 },
							),
						);
					};
				}),
		);

		const firstResponse = await worker.fetch(createAssetRequest("/ativos/PETR4", token), env, firstCtx.ctx);
		const secondResponse = await worker.fetch(createAssetRequest("/ativos/PETR4", token), env, secondCtx.ctx);

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

		const response = await worker.fetch(createAssetRequest("/ativos/vale3", token), createEnv(fakeDb));
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

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4"), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_TOKEN");
	});

	it("returns 401 when the token is invalid", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4", "not-a-jwt"), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_TOKEN");
	});

	it("returns 401 when the token is expired", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken({
			exp: 1,
		});

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_TOKEN");
	});

	it("returns 422 for invalid tickers", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken();

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4.SA", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string; message: string } }>();

		expect(response.status).toBe(422);
		expect(payload.error.code).toBe("VALIDATION_ERROR");
		expect(payload.error.message).toBe("Invalid asset ticker");
	});

	it("returns 404 when the asset does not exist", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken();

		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }));

		const response = await worker.fetch(createAssetRequest("/ativos/ABCD1", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(404);
		expect(payload.error.code).toBe("ASSET_NOT_FOUND");
	});

	it("returns 502 when the asset provider fails", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken();

		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("upstream error", { status: 500 }));

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(502);
		expect(payload.error.code).toBe("EXTERNAL_SERVICE_ERROR");
	});

	it("returns 502 when the asset provider times out", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken();

		vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("Timed out", "AbortError"));

		const response = await worker.fetch(createAssetRequest("/ativos/PETR4", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string; message: string } }>();

		expect(response.status).toBe(502);
		expect(payload.error.code).toBe("EXTERNAL_SERVICE_ERROR");
		expect(payload.error.message).toBe("Asset provider request timed out");
	});
});

describe("GET /ativos/:ticker?type=crypto", () => {
	it("creates crypto cache on the first lookup and returns cache metadata", async () => {
		const fakeDb = createFakeD1Database();
		const env = createEnv(fakeDb);
		const token = await createAccessToken();

		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					results: [
						{
							symbol: "BTC",
							longName: "Bitcoin",
							currency: "USD",
							regularMarketPrice: 30.99,
							regularMarketChange: 0.42,
							regularMarketChangePercent: 1.37,
							regularMarketTime: "2026-03-11T00:38:08.000Z",
						},
					],
				}),
				{ status: 200 },
			),
		);

		const response = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), env);
		const payload = await response.json<{
			data: { symbol: string; currency: string; quotedAt: string };
			cache: { key: string; stale: boolean; source: string };
		}>();

		expect(response.status).toBe(200);
		expect(payload.data.symbol).toBe("BTC");
		expect(payload.data.currency).toBe("USD");
		expect(payload.data.quotedAt).toBe("2026-03-11T00:38:08.000Z");
		expect(payload.cache.key).toBe("crypto-quote:v1:BTC");
		expect(payload.cache.stale).toBe(false);
		expect(payload.cache.source).toBe("live");
		expect(JSON.parse(env.ASSET_CACHE.readRaw("crypto-quote:v1:BTC") ?? "{}")).toMatchObject({
			symbol: "BTC",
			data: expect.objectContaining({ symbol: "BTC" }),
		});
	});

	it("serves repeated crypto lookups from KV and isolates cache by symbol", async () => {
		const fakeDb = createFakeD1Database();
		const env = createEnv(fakeDb);
		const token = await createAccessToken();
		const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
			const url = String(input);

			if (url.endsWith("/quote/BTC")) {
				return new Response(JSON.stringify({ results: [{ symbol: "BTC", longName: "Bitcoin" }] }), { status: 200 });
			}

			if (url.endsWith("/quote/ETH")) {
				return new Response(JSON.stringify({ results: [{ symbol: "ETH", longName: "Ethereum" }] }), { status: 200 });
			}

			throw new Error(`Unexpected URL ${url}`);
		});

		await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), env);
		const secondBtc = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), env);
		await worker.fetch(createAssetRequest("/ativos/ETH?type=crypto", token), env);
		const payload = await secondBtc.json<{ cache: { source: string } }>();

		expect(secondBtc.status).toBe(200);
		expect(payload.cache.source).toBe("cache");
		expect(fetchMock).toHaveBeenCalledTimes(2);
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

		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					results: [
						{
							symbol: "BTC",
							longName: "Bitcoin",
							currency: "USD",
							regularMarketPrice: 999,
							regularMarketTime: "2026-03-10T18:06:00.000Z",
						},
					],
				}),
				{ status: 200 },
			),
		);

		const response = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), env, ctx);
		const payload = await response.json<{ data: { price: number }; cache: { stale: boolean; source: string } }>();

		expect(response.status).toBe(200);
		expect(payload.data.price).toBe(10);
		expect(payload.cache.stale).toBe(true);
		expect(payload.cache.source).toBe("cache");

		await flushWaitUntil();

		expect(JSON.parse(env.ASSET_CACHE.readRaw("crypto-quote:v1:BTC") ?? "{}")).toMatchObject({
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
			async () =>
				new Promise<Response>((resolve) => {
					resolveRefresh = () => {
						resolve(
							new Response(
								JSON.stringify({
									results: [{ symbol: "BTC", longName: "Bitcoin", regularMarketPrice: 321 }],
								}),
								{ status: 200 },
							),
						);
					};
				}),
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
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(env.ASSET_CACHE.readRaw("crypto-quote-lock:v1:BTC")).toBe("1");

		resolveRefresh();
		await firstCtx.flushWaitUntil();
		await secondCtx.flushWaitUntil();

		expect(env.ASSET_CACHE.readRaw("crypto-quote-lock:v1:BTC")).toBeNull();
	});

	it("returns 401 without a token", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto"), createEnv(fakeDb));
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

		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }));

		const response = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), createEnv(fakeDb));
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(404);
		expect(payload.error.code).toBe("ASSET_NOT_FOUND");
	});

	it("returns 502 when the crypto provider fails", async () => {
		const fakeDb = createFakeD1Database();
		const token = await createAccessToken();

		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("upstream error", { status: 500 }));

		const response = await worker.fetch(createAssetRequest("/ativos/BTC?type=crypto", token), createEnv(fakeDb));
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
