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

describe("CLI API client", () => {
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
