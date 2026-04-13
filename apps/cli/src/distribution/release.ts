import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RELEASE_TARGETS,
  type ReleaseManifest,
  createReleaseManifest,
} from "@finta/cli-distribution";

const here = dirname(fileURLToPath(import.meta.url));

export const RELEASES_DIR = resolve(here, "../../dist/releases");
export const GENERATED_LATEST_RELEASE_PATH = resolve(
  here,
  "../../../../packages/cli-distribution/src/generated/latest-release.ts",
);

async function getFileMetadata(path: string) {
  const content = await readFile(path);
  return {
    sha256: createHash("sha256").update(content).digest("hex"),
    size: content.byteLength,
  };
}

export function renderLatestReleaseModule(manifest: ReleaseManifest) {
  return `import type { ReleaseManifest } from "../index";

export const latestReleaseManifest: ReleaseManifest = ${JSON.stringify(
    manifest,
    null,
    2,
  )};
`;
}

export async function createReleaseOutputs(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  artifactBaseUrl: string;
}) {
  const versionDir = join(input.releasesDir, input.version);
  const targets = Object.fromEntries(
    await Promise.all(
      RELEASE_TARGETS.map(async (target) => [
        target.key,
        await getFileMetadata(join(versionDir, target.artifactName)),
      ]),
    ),
  ) as Record<
    (typeof RELEASE_TARGETS)[number]["key"],
    { sha256: string; size: number }
  >;

  const manifest = createReleaseManifest({
    version: input.version,
    publishedAt: input.publishedAt,
    artifactBaseUrl: input.artifactBaseUrl,
    targets,
  });

  return {
    manifest,
    versionManifestPath: join(versionDir, "manifest.json"),
    latestManifestPath: join(input.releasesDir, "latest", "manifest.json"),
    generatedModulePath: GENERATED_LATEST_RELEASE_PATH,
    generatedModuleSource: renderLatestReleaseModule(manifest),
  };
}

export async function writeReleaseOutputs(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  artifactBaseUrl: string;
}) {
  const outputs = await createReleaseOutputs(input);

  await mkdir(dirname(outputs.versionManifestPath), { recursive: true });
  await mkdir(dirname(outputs.latestManifestPath), { recursive: true });
  await mkdir(dirname(outputs.generatedModulePath), { recursive: true });

  const manifestJson = JSON.stringify(outputs.manifest, null, 2) + "\n";

  await writeFile(outputs.versionManifestPath, manifestJson, "utf8");
  await writeFile(outputs.latestManifestPath, manifestJson, "utf8");
  await writeFile(
    outputs.generatedModulePath,
    outputs.generatedModuleSource,
    "utf8",
  );

  return outputs;
}
