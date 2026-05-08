import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));

const requireApiKeyMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue("test-token"),
);

vi.mock("../api/client", () => ({
  api: {
    favorites: {
      list: apiMocks.list,
      add: apiMocks.add,
      remove: apiMocks.remove,
    },
    auth: {},
    quotes: {},
    dashboard: {},
    recentAssets: {},
  },
  loadConfig: () => Promise.resolve({ apiKey: "test-token" }),
  saveConfig: vi.fn(),
  clearConfig: vi.fn(),
  isRevokedKeyError: () => false,
  toStoredCliConfig: (s: unknown) => s,
}));

describe("headless favorites command", () => {
  let stdoutBuffer: string;
  let stderrBuffer: string;

  beforeEach(() => {
    stdoutBuffer = "";
    stderrBuffer = "";
    apiMocks.list.mockReset().mockResolvedValue({ data: [] });
    apiMocks.add.mockReset().mockResolvedValue(undefined);
    apiMocks.remove.mockReset().mockResolvedValue(undefined);
    requireApiKeyMock.mockClear();

    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      stdoutBuffer += String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
      stderrBuffer += String(chunk);
      return true;
    });
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`__exit__:${code ?? 0}`);
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function run(args: string[]) {
    const { runHeadless } = await import("./index");
    try {
      await runHeadless({ name: "favorites", args });
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const match = /^__exit__:(\d+)$/.exec(message);
      if (match) {
        return Number.parseInt(match[1]!, 10);
      }
      throw error;
    }
  }

  it("defaults to list when no subcommand is given", async () => {
    apiMocks.list.mockResolvedValueOnce({
      data: [{ symbol: "PETR4", type: "stock" }],
    });

    const exit = await run([]);

    expect(exit).toBeNull();
    expect(apiMocks.list).toHaveBeenCalledWith("test-token");
    expect(stdoutBuffer).toContain("PETR4");
  });

  it("explicit list subcommand prints JSON", async () => {
    apiMocks.list.mockResolvedValueOnce({
      data: [{ symbol: "BTC", type: "crypto" }],
    });

    await run(["list"]);

    expect(apiMocks.list).toHaveBeenCalled();
    expect(stdoutBuffer).toContain("BTC");
    expect(stdoutBuffer).toContain("crypto");
  });

  it("rejects unknown subcommand with non-zero exit", async () => {
    const exit = await run(["clear"]);

    expect(exit).toBe(1);
    expect(stderrBuffer.toLowerCase()).toContain("unknown subcommand");
    expect(apiMocks.add).not.toHaveBeenCalled();
    expect(apiMocks.remove).not.toHaveBeenCalled();
    expect(apiMocks.list).not.toHaveBeenCalled();
  });

  it("add without symbol exits non-zero and does not call the API", async () => {
    const exit = await run(["add"]);

    expect(exit).toBe(1);
    expect(apiMocks.add).not.toHaveBeenCalled();
  });

  it("add without assetType exits non-zero and does not call the API", async () => {
    const exit = await run(["add", "PETR4"]);

    expect(exit).toBe(1);
    expect(apiMocks.add).not.toHaveBeenCalled();
  });

  it("add with invalid assetType exits non-zero and does not call the API", async () => {
    const exit = await run(["add", "PETR4", "bond"]);

    expect(exit).toBe(1);
    expect(stderrBuffer.toLowerCase()).toContain("invalid asset type");
    expect(stderrBuffer).toContain("bond");
    expect(apiMocks.add).not.toHaveBeenCalled();
  });

  it("add with valid args calls api.favorites.add(symbol, type)", async () => {
    const exit = await run(["add", "PETR4", "stock"]);

    expect(exit).toBeNull();
    expect(apiMocks.add).toHaveBeenCalledWith("test-token", "PETR4", "stock");
  });

  it("remove with invalid assetType exits non-zero and does not call the API", async () => {
    const exit = await run(["remove", "BTC", "wat"]);

    expect(exit).toBe(1);
    expect(apiMocks.remove).not.toHaveBeenCalled();
  });

  it("remove with valid args calls api.favorites.remove(symbol, type)", async () => {
    const exit = await run(["remove", "BTC", "crypto"]);

    expect(exit).toBeNull();
    expect(apiMocks.remove).toHaveBeenCalledWith("test-token", "BTC", "crypto");
  });
});
