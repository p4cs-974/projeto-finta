import { createReleaseManifest } from "@finta/cli-distribution";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCloudflareContext } = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

import { GET } from "./route";

describe("GET /releases/latest/manifest.json", () => {
  beforeEach(() => {
    const manifest = createReleaseManifest({
      version: "1.2.3",
      publishedAt: "2026-04-12T18:30:00.000Z",
      targets: {
        "darwin-x64": {
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-darwin-x64",
          sha256: "a".repeat(64),
          size: 101,
        },
        "darwin-arm64": {
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-darwin-arm64",
          sha256: "b".repeat(64),
          size: 102,
        },
        "linux-x64": {
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-x64",
          sha256: "c".repeat(64),
          size: 103,
        },
        "linux-arm64": {
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-arm64",
          sha256: "d".repeat(64),
          size: 104,
        },
      },
    });

    getCloudflareContext.mockResolvedValue({
      env: {
        FINTA_RELEASES_BUCKET: {
          get: vi.fn().mockResolvedValue({
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify(manifest)),
                );
                controller.close();
              },
            }),
            size: JSON.stringify(manifest).length,
            httpEtag: '"manifest-etag"',
            writeHttpMetadata(headers: Headers) {
              headers.set("content-type", "application/json; charset=utf-8");
              headers.set("cache-control", "public, max-age=300, s-maxage=300");
            },
          }),
        },
      },
    });
  });

  it("serves the latest stable release manifest", async () => {
    const response = await GET();
    const payload = (await response.json()) as {
      install: { command: string; bootstrapUrl: string; manifestUrl: string };
      targets: Record<string, { url: string; sha256: string }>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("etag")).toBe('"manifest-etag"');
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
