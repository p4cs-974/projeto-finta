import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearConfig,
  loadConfig,
  saveConfig,
  type StoredConfig,
} from "./client";

describe("CLI config storage", () => {
  let configDir: string;

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), "finta-cli-"));
    process.env.FINTA_CONFIG_DIR = configDir;
  });

  afterEach(async () => {
    delete process.env.FINTA_CONFIG_DIR;
    await rm(configDir, { recursive: true, force: true });
  });

  function createConfig(): StoredConfig {
    return {
      apiKey: "finta_test-key",
      apiUrl: "http://localhost:8787",
      user: {
        id: 1,
        name: "Pedro Custodio",
        email: "pedro@example.com",
      },
      keyName: "CLI - macbook - 2026-04-12",
      keyId: 7,
    };
  }

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
