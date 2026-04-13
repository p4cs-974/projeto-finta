import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_HOST,
  RELEASE_TARGETS,
  createReleaseManifest,
  getReleaseArtifactUrl,
  getVersionManifestObjectKey,
} from "@finta/cli-distribution";

const here = dirname(fileURLToPath(import.meta.url));

export const RELEASES_DIR = resolve(here, "../../dist/releases");

async function getFileMetadata(path: string) {
  const content = await readFile(path);
  return {
    sha256: createHash("sha256").update(content).digest("hex"),
    size: content.byteLength,
  };
}

export async function createReleaseOutputs(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  publicHost?: string;
}) {
  const versionDir = join(input.releasesDir, input.version);
  const targets = Object.fromEntries(
    await Promise.all(
      RELEASE_TARGETS.map(async (target) => [
        target.key,
        {
          ...(await getFileMetadata(join(versionDir, target.artifactName))),
          url: getReleaseArtifactUrl(
            input.version,
            target.key,
            input.publicHost ?? CANONICAL_HOST,
          ),
        },
      ]),
    ),
  ) as Record<
    (typeof RELEASE_TARGETS)[number]["key"],
    Awaited<ReturnType<typeof getFileMetadata>> & { url: string }
  >;

  const manifest = createReleaseManifest({
    version: input.version,
    publishedAt: input.publishedAt,
    targets,
  });

  return {
    manifest,
    versionManifestPath: join(
      input.releasesDir,
      getVersionManifestObjectKey(input.version).replace(/^releases\//, ""),
    ),
  };
}

export async function writeReleaseOutputs(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  publicHost?: string;
}) {
  const outputs = await createReleaseOutputs(input);

  await mkdir(dirname(outputs.versionManifestPath), { recursive: true });

  const manifestJson = JSON.stringify(outputs.manifest, null, 2) + "\n";

  await writeFile(outputs.versionManifestPath, manifestJson, "utf8");

  return outputs;
}
