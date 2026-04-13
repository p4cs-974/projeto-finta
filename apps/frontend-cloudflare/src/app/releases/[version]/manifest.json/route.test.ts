import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCloudflareContext, bucketGet } = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
  bucketGet: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

import { GET } from "./route";

describe("GET /releases/[version]/manifest.json", () => {
  beforeEach(() => {
    bucketGet.mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('{"version":"1.2.3","targets":{}}'),
          );
          controller.close();
        },
      }),
      size: 29,
      httpEtag: '"version-manifest"',
      writeHttpMetadata(headers: Headers) {
        headers.set("content-type", "application/json; charset=utf-8");
      },
    });

    getCloudflareContext.mockResolvedValue({
      env: {
        FINTA_RELEASES_BUCKET: {
          get: bucketGet,
        },
      },
    });
  });

  it("reads the requested version manifest from release storage", async () => {
    const response = await GET(new Request("https://finta.test"), {
      params: Promise.resolve({ version: "1.2.3" }),
    });

    expect(bucketGet).toHaveBeenCalledWith("releases/1.2.3/manifest.json");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.text()).resolves.toContain('"version":"1.2.3"');
  });
});
