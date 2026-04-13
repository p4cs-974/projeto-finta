import {
  CANONICAL_HOST,
  getVersionManifestUrl,
  type SupportedTargetKey,
} from "@finta/cli-distribution";

import {
  fetchReleaseManifest,
  parseArgs,
  verifyDownloadedArtifact,
} from "../src/distribution/publishing";
import { CLI_VERSION } from "../src/version";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version ?? CLI_VERSION;
  const publicHost = args["public-host"] ?? CANONICAL_HOST;
  const manifestUrl = getVersionManifestUrl(version, publicHost);
  const manifest = await fetchReleaseManifest(manifestUrl);

  if (manifest.version !== version) {
    throw new Error(
      `Expected release manifest version ${version} but received ${manifest.version}`,
    );
  }

  for (const [targetKey, target] of Object.entries(manifest.targets) as Array<
    [SupportedTargetKey, (typeof manifest.targets)[SupportedTargetKey]]
  >) {
    process.stdout.write(`Verifying ${targetKey} from ${target.url}...\n`);
    await verifyDownloadedArtifact({
      artifactUrl: target.url,
      expectedSha256: target.sha256,
      expectedVersion: manifest.version,
      targetKey,
    });
  }

  process.stdout.write(`Verified ${manifest.version} from ${manifestUrl}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `release verification failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
