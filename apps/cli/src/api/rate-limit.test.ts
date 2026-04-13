import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("CLI request rate limiting", () => {
  let configDir: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));

    configDir = await mkdtemp(join(tmpdir(), "finta-cli-rate-limit-"));
    process.env.FINTA_CONFIG_DIR = configDir;
    process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS = "2";
    process.env.FINTA_CLI_RATE_LIMIT_WINDOW_MS = "1000";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        return new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();

    delete process.env.FINTA_CONFIG_DIR;
    delete process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.FINTA_CLI_RATE_LIMIT_WINDOW_MS;

    await rm(configDir, { recursive: true, force: true });
  });

  it("blocks requests once the CLI request budget is exhausted", async () => {
    const { api } = await import("./client");

    await expect(api.quotes.get("test-token", "PETR4")).resolves.toEqual({
      data: { ok: true },
    });
    await expect(api.quotes.get("test-token", "VALE3")).resolves.toEqual({
      data: { ok: true },
    });
    await expect(api.quotes.get("test-token", "ITUB4")).rejects.toThrow(
      /rate limit/i,
    );

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("persists the request budget across fresh CLI module loads", async () => {
    const firstLoad = await import("./client");

    await firstLoad.api.quotes.get("test-token", "PETR4");
    await firstLoad.api.quotes.get("test-token", "VALE3");

    vi.resetModules();

    const secondLoad = await import("./client");

    await expect(
      secondLoad.api.quotes.get("test-token", "ITUB4"),
    ).rejects.toThrow(/rate limit/i);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("allows requests again after the cooldown window expires", async () => {
    const { api } = await import("./client");

    await api.quotes.get("test-token", "PETR4");
    await api.quotes.get("test-token", "VALE3");
    await expect(api.quotes.get("test-token", "ITUB4")).rejects.toThrow(
      /rate limit/i,
    );

    vi.setSystemTime(new Date("2026-04-12T12:00:01.001Z"));

    await expect(api.quotes.get("test-token", "ITSA4")).resolves.toEqual({
      data: { ok: true },
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
