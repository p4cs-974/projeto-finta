import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /releases/latest/manifest.json", () => {
  it("serves the latest stable release manifest", async () => {
    const response = await GET();
    const payload = (await response.json()) as {
      install: { command: string; bootstrapUrl: string; manifestUrl: string };
      targets: Record<string, { url: string; sha256: string }>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(payload.install.command).toBe(
      "curl -fsSL https://finta.p4cs.com.br/install.sh | bash",
    );
    expect(payload.install.bootstrapUrl).toBe(
      "https://finta.p4cs.com.br/install.sh",
    );
    expect(payload.install.manifestUrl).toBe(
      "https://finta.p4cs.com.br/releases/latest/manifest.json",
    );
    expect(Object.keys(payload.targets)).toEqual([
      "darwin-x64",
      "darwin-arm64",
      "linux-x64",
      "linux-arm64",
    ]);
    expect(payload.targets["darwin-arm64"]?.url).toContain("/releases/");
    expect(payload.targets["darwin-arm64"]?.sha256).toHaveLength(64);
  });
});
