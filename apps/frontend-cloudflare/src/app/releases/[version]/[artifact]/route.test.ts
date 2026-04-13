import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCloudflareContext, bucketGet } = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
  bucketGet: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

import { GET } from "./route";

describe("GET /releases/[version]/[artifact]", () => {
  beforeEach(() => {
    bucketGet.mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("artifact-binary"));
          controller.close();
        },
      }),
      size: "artifact-binary".length,
      httpEtag: '"artifact-etag"',
      writeHttpMetadata(headers: Headers) {
        headers.set("content-type", "application/octet-stream");
        headers.set("cache-control", "public, max-age=31536000, immutable");
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

  it("streams versioned release artifacts from release storage", async () => {
    const response = await GET(new Request("https://finta.test"), {
      params: Promise.resolve({
        version: "1.2.3",
        artifact: "finta-linux-x64",
      }),
    });

    expect(bucketGet).toHaveBeenCalledWith("releases/1.2.3/finta-linux-x64");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/octet-stream",
    );
    expect(response.headers.get("etag")).toBe('"artifact-etag"');
    await expect(response.text()).resolves.toBe("artifact-binary");
  });
});
