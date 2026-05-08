import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveConfig } from "../api/client";
import { runHeadless } from "./index";

function dashboardPayload() {
  return {
    stats: { favoritesCount: 1, searchesToday: 2, viewsToday: 3 },
    recentSelections: [],
    activityTimeline: [],
    marketMovers: { gainers: [], losers: [] },
    generatedAt: new Date().toISOString(),
  };
}

describe("headless dashboard command", () => {
  let configDir: string;
  let stdout = "";

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), "finta-cli-headless-"));
    process.env.FINTA_CONFIG_DIR = configDir;
    process.env.FINTA_API_URL = "http://api.test";
    process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS = "1000";
    stdout = "";
    vi.spyOn(process.stdout, "write").mockImplementation(
      (chunk: string | Uint8Array) => {
        stdout += chunk.toString();
        return true;
      },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(dashboardPayload()), { status: 200 }),
    );
    await saveConfig({
      apiKey: "finta_test_key",
      apiUrl: "http://api.test",
      user: { id: 1, name: "Pedro", email: "pedro@example.com" },
      keyName: "CLI - test",
      keyId: 1,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    delete process.env.FINTA_CONFIG_DIR;
    delete process.env.FINTA_API_URL;
    delete process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS;
    await rm(configDir, { recursive: true, force: true });
  });

  it("prints formatted dashboard text by default", async () => {
    await runHeadless({ name: "dashboard", args: [] });

    expect(stdout).toContain("Painel");
    expect(stdout).toContain("Favoritos: 1");
    expect(stdout).not.toMatch(/^\{/);
    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/users/me/dashboard",
      expect.objectContaining({
        headers: { Authorization: "Bearer finta_test_key" },
      }),
    );
  });

  it("prints raw JSON when requested", async () => {
    await runHeadless({ name: "dashboard", args: [] }, { json: true });

    expect(JSON.parse(stdout)).toMatchObject({
      stats: { favoritesCount: 1, searchesToday: 2, viewsToday: 3 },
    });
  });
});
