import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createLatestManifestUpload,
  createVersionReleaseUploads,
} from "./publishing";

describe("release publishing", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("builds versioned upload objects from local artifacts", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "finta-publish-"));
    tempDirs.push(rootDir);

    const versionDir = join(rootDir, "1.2.3");
    await mkdir(versionDir, { recursive: true });

    await writeFile(join(versionDir, "finta-darwin-x64"), "darwin-x64");
    await writeFile(join(versionDir, "finta-darwin-arm64"), "darwin-arm64");
    await writeFile(join(versionDir, "finta-linux-x64"), "linux-x64");
    await writeFile(join(versionDir, "finta-linux-arm64"), "linux-arm64");

    const { manifest, uploads } = await createVersionReleaseUploads({
      version: "1.2.3",
      publishedAt: "2026-04-12T21:00:00.000Z",
      releasesDir: rootDir,
      targetKeys: ["darwin-x64", "darwin-arm64", "linux-x64", "linux-arm64"],
    });

    expect(manifest.targets["linux-arm64"].url).toBe(
      "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-arm64",
    );
    expect(uploads).toHaveLength(5);
    expect(uploads[0]).toMatchObject({
      kind: "artifact",
      objectKey: "releases/1.2.3/finta-darwin-x64",
    });
    expect(uploads.at(-1)).toMatchObject({
      kind: "version-manifest",
      objectKey: "releases/1.2.3/manifest.json",
      contentType: "application/json; charset=utf-8",
    });
  });

  it("builds a separate latest-manifest upload for promotion", () => {
    const manifestUpload = createLatestManifestUpload({
      schemaVersion: 1,
      channel: "stable",
      name: "finta",
      version: "1.2.3",
      publishedAt: "2026-04-12T21:00:00.000Z",
      install: {
        command: "curl -fsSL https://finta.p4cs.com.br/install.sh | bash",
        bootstrapUrl: "https://finta.p4cs.com.br/install.sh",
        manifestUrl: "https://finta.p4cs.com.br/releases/latest/manifest.json",
      },
      targets: {
        "darwin-x64": {
          os: "darwin",
          arch: "x64",
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-darwin-x64",
          sha256: "a".repeat(64),
          size: 1,
        },
        "darwin-arm64": {
          os: "darwin",
          arch: "arm64",
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-darwin-arm64",
          sha256: "b".repeat(64),
          size: 1,
        },
        "linux-x64": {
          os: "linux",
          arch: "x64",
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-x64",
          sha256: "c".repeat(64),
          size: 1,
        },
        "linux-arm64": {
          os: "linux",
          arch: "arm64",
          url: "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-arm64",
          sha256: "d".repeat(64),
          size: 1,
        },
      },
    });

    expect(manifestUpload.kind).toBe("latest-manifest");
    expect(manifestUpload.objectKey).toBe("releases/latest/manifest.json");
    expect(manifestUpload.publicUrl).toBe(
      "https://finta.p4cs.com.br/releases/latest/manifest.json",
    );
  });
});
