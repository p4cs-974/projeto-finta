import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createReleaseOutputs } from "./release";

describe("createReleaseOutputs", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("builds a checksummed manifest and generated latest-release module from artifacts", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "finta-release-"));
    tempDirs.push(rootDir);

    const releasesDir = join(rootDir, "releases");
    const versionDir = join(releasesDir, "1.2.3");
    await mkdir(versionDir, { recursive: true });

    await writeFile(join(versionDir, "finta-darwin-x64"), "darwin-x64");
    await writeFile(join(versionDir, "finta-darwin-arm64"), "darwin-arm64");
    await writeFile(join(versionDir, "finta-linux-x64"), "linux-x64");
    await writeFile(join(versionDir, "finta-linux-arm64"), "linux-arm64");

    const outputs = await createReleaseOutputs({
      version: "1.2.3",
      publishedAt: "2026-04-12T21:00:00.000Z",
      releasesDir,
    });

    expect(outputs.manifest.version).toBe("1.2.3");
    expect(outputs.manifest.targets["linux-arm64"].url).toBe(
      "https://finta.p4cs.com.br/releases/1.2.3/finta-linux-arm64",
    );
    expect(outputs.manifest.targets["linux-arm64"].sha256).toHaveLength(64);
    expect(outputs.manifest.targets["linux-arm64"].size).toBe(
      "linux-arm64".length,
    );
    expect(outputs.versionManifestPath).toBe(
      join(releasesDir, "1.2.3", "manifest.json"),
    );
    expect(outputs.manifest.install.manifestUrl).toBe(
      "https://finta.p4cs.com.br/releases/latest/manifest.json",
    );
    expect(outputs.manifest.targets["linux-arm64"]).toBeDefined();
  });
});
