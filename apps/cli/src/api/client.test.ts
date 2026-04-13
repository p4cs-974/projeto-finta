import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
