import { CANONICAL_HOST, getVersionManifestUrl } from "@finta/cli-distribution";

import {
  createLatestManifestUpload,
  fetchReleaseManifest,
  parseArgs,
  resolveReleaseBucketName,
  uploadReleaseObject,
} from "../src/distribution/publishing";
import { CLI_VERSION } from "../src/version";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version ?? CLI_VERSION;
  const publicHost = args["public-host"] ?? CANONICAL_HOST;
  const bucketName = await resolveReleaseBucketName(args);

  const manifest = await fetchReleaseManifest(
    getVersionManifestUrl(version, publicHost),
  );
  const latestManifestUpload = createLatestManifestUpload(manifest, publicHost);

  process.stdout.write(`Promoting ${version} to latest...\n`);
  await uploadReleaseObject({
    bucketName,
    upload: latestManifestUpload,
  });
  process.stdout.write(
    `Promoted ${version} to ${latestManifestUpload.publicUrl}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `release promotion failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
