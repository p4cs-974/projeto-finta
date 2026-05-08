import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearConfig,
  getApiUrl,
  loadConfig,
  saveConfig,
  type StoredConfig,
} from "./client";

describe("CLI API client", () => {
  let configDir: string;

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), "finta-cli-"));
    process.env.FINTA_CONFIG_DIR = configDir;
  });

  afterEach(async () => {
    delete process.env.FINTA_CONFIG_DIR;
    delete process.env.FINTA_API_URL;
    await rm(configDir, { recursive: true, force: true });
  });

  function createConfig(): StoredConfig {
    return {
      apiKey: "finta_test-key",
      apiUrl: "https://api.finta.p4cs.com.br",
      user: {
        id: 1,
        name: "Pedro Custodio",
        email: "pedro@example.com",
      },
      keyName: "CLI - macbook - 2026-04-12",
      keyId: 7,
    };
  }

  it("defaults to the production API URL", () => {
    delete process.env.FINTA_API_URL;

    expect(getApiUrl()).toBe("https://api.finta.p4cs.com.br");
  });

  it("allows the API URL to be overridden for local development", () => {
    process.env.FINTA_API_URL = "http://localhost:8787";

    expect(getApiUrl()).toBe("http://localhost:8787");
  });

  it("writes valid JSON to the config file", async () => {
    const config = createConfig();

    await saveConfig(config);

    await expect(loadConfig()).resolves.toEqual(config);
  });

  it("reads and parses the config file", async () => {
    const config = createConfig();
    await saveConfig(config);

    const loaded = await loadConfig();

    expect(loaded).toEqual(config);
  });

  it("returns null when the config file does not exist", async () => {
    await expect(loadConfig()).resolves.toBeNull();
  });

  it("removes the config file", async () => {
    await saveConfig(createConfig());

    await clearConfig();

    await expect(loadConfig()).resolves.toBeNull();
  });

  it("preserves data integrity across save/load round trips", async () => {
    const config = createConfig();

    await saveConfig(config);
    const loaded = await loadConfig();

    expect(loaded).toEqual(config);
  });

  it("normalizes the backend dashboard envelope into the shared dashboard snapshot", async () => {
    process.env.FINTA_API_URL = "http://api.test";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            stats: { favoritesCount: 1, searchesToday: 2, viewsToday: 3 },
            recentSelections: [
              {
                symbol: "PETR4",
                type: "stock",
                label: "Petrobras",
                market: "B3",
                currency: "BRL",
                logoUrl: null,
                lastSelectedAt: "2026-05-06T12:00:00.000Z",
              },
            ],
            activityTimeline: [],
            marketMovers: {
              gainers: [
                {
                  symbol: "BTC",
                  type: "crypto",
                  initialQuote: {
                    data: {
                      symbol: "BTC",
                      name: "Bitcoin",
                      currency: "USD",
                      price: 100000,
                      change: 1,
                      changePercent: 1,
                      quotedAt: "2026-05-06T12:00:00.000Z",
                      logoUrl: null,
                    },
                    cache: {
                      key: "crypto:BTC",
                      updatedAt: "2026-05-06T12:00:00.000Z",
                      stale: false,
                      source: "cache",
                    },
                  },
                },
              ],
              losers: [],
            },
            generatedAt: "2026-05-06T12:10:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );

    const { api } = await import("./client");
    const snapshot = await api.dashboard.get("token");

    expect(snapshot.recentSelections[0]?.assetType).toBe("stock");
    expect(snapshot.marketMovers.gainers[0]?.assetType).toBe("crypto");
    expect(snapshot.stats.favoritesCount).toBe(1);
  });
});

describe("api.favorites HTTP client", () => {
  let configDir: string;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), "finta-cli-favorites-"));
    process.env.FINTA_CONFIG_DIR = configDir;
    process.env.FINTA_API_URL = "http://api.test";
    process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS = "100";
    process.env.FINTA_CLI_RATE_LIMIT_WINDOW_MS = "60000";

    fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.resetModules();

    delete process.env.FINTA_CONFIG_DIR;
    delete process.env.FINTA_API_URL;
    delete process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.FINTA_CLI_RATE_LIMIT_WINDOW_MS;

    await rm(configDir, { recursive: true, force: true });
  });

  function takeRequest(): { method: string; url: string; body: unknown; auth: string | null } {
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers?: Record<string, string>; body?: string },
    ];
    const headers = (init.headers ?? {}) as Record<string, string>;
    return {
      method: init.method ?? "GET",
      url,
      body: init.body ? JSON.parse(init.body as string) : undefined,
      auth: headers.Authorization ?? headers.authorization ?? null,
    };
  }

  it("list issues a GET to /users/me/favorites with the bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { api } = await import("./client");
    await api.favorites.list("token-abc");

    const req = takeRequest();
    expect(req.method).toBe("GET");
    expect(req.url).toBe("http://api.test/users/me/favorites");
    expect(req.auth).toBe("Bearer token-abc");
    expect(req.body).toBeUndefined();
  });

  it("add issues a POST with body { symbol, type } and Authorization header", async () => {
    const { api } = await import("./client");
    await api.favorites.add("token-abc", "PETR4", "stock");

    const req = takeRequest();
    expect(req.method).toBe("POST");
    expect(req.url).toBe("http://api.test/users/me/favorites");
    expect(req.auth).toBe("Bearer token-abc");
    expect(req.body).toEqual({ symbol: "PETR4", type: "stock" });
  });

  it("remove issues a DELETE with body { symbol, type } and Authorization header", async () => {
    const { api } = await import("./client");
    await api.favorites.remove("token-xyz", "BTC", "crypto");

    const req = takeRequest();
    expect(req.method).toBe("DELETE");
    expect(req.url).toBe("http://api.test/users/me/favorites");
    expect(req.auth).toBe("Bearer token-xyz");
    expect(req.body).toEqual({ symbol: "BTC", type: "crypto" });
  });

  it("favorites add consumes a CLI rate limit slot like other requests", async () => {
    process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS = "1";
    vi.resetModules();

    const { api, CliRateLimitError } = await import("./client");
    await api.favorites.add("token", "PETR4", "stock");

    await expect(
      api.favorites.add("token", "VALE3", "stock"),
    ).rejects.toBeInstanceOf(CliRateLimitError);
  });
});
