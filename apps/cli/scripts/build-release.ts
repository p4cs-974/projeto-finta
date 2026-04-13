import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { RELEASE_TARGETS } from "@finta/cli-distribution";

import { RELEASES_DIR, writeReleaseOutputs } from "../src/distribution/release";
import { CLI_VERSION } from "../src/version";

const execFileAsync = promisify(execFile);
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv: string[]) {
  const parsed: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg?.startsWith("--")) {
      continue;
    }

    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    parsed[arg.slice(2)] = value;
    index += 1;
  }

  return parsed;
}

async function buildArtifact(
  targetKey: (typeof RELEASE_TARGETS)[number]["key"],
  version: string,
) {
  const target = RELEASE_TARGETS.find(
    (candidate) => candidate.key === targetKey,
  );

  if (!target) {
    throw new Error(`Unsupported release target: ${targetKey}`);
  }

  const outputPath = join(RELEASES_DIR, version, target.artifactName);

  await mkdir(dirname(outputPath), { recursive: true });

  await execFileAsync(
    "bun",
    [
      "build",
      "--compile",
      "--outfile",
      outputPath,
      "--target",
      `bun-${target.key}`,
      "src/distribution/index.tsx",
    ],
    {
      cwd: packageRoot,
      env: process.env,
    },
  );

  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version ?? CLI_VERSION;
  const publishedAt = args["published-at"] ?? new Date().toISOString();
  const targetKeys = (args.targets?.split(",") ??
    RELEASE_TARGETS.map(
      (target) => target.key,
    )) as (typeof RELEASE_TARGETS)[number]["key"][];

  for (const targetKey of targetKeys) {
    process.stdout.write(`Building ${targetKey}...\n`);
    await buildArtifact(targetKey, version);
  }

  const outputs = await writeReleaseOutputs({
    version,
    publishedAt,
    releasesDir: RELEASES_DIR,
  });

  process.stdout.write(`Wrote ${outputs.versionManifestPath}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `release build failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
