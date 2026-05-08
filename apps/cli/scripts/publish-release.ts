import { CANONICAL_HOST } from "@finta/cli-distribution";

import { RELEASES_DIR } from "../src/distribution/release";
import {
  createVersionReleaseUploads,
  parseArgs,
  resolveReleaseBucketName,
  resolveTargetKeys,
  uploadReleaseObject,
} from "../src/distribution/publishing";
import { CLI_VERSION } from "../src/version";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version ?? CLI_VERSION;
  const publishedAt = args["published-at"] ?? new Date().toISOString();
  const publicHost = args["public-host"] ?? CANONICAL_HOST;
  const bucketName = await resolveReleaseBucketName(args);

  const { uploads } = await createVersionReleaseUploads({
    version,
    publishedAt,
    releasesDir: RELEASES_DIR,
    publicHost,
    targetKeys: resolveTargetKeys(args.targets),
  });

  for (const upload of uploads) {
    process.stdout.write(`Uploading ${upload.objectKey}...\n`);
    await uploadReleaseObject({ bucketName, upload });
  }

  const versionManifest = uploads.find(
    (upload) => upload.kind === "version-manifest",
  );
  process.stdout.write(
    `Published ${version} to ${publicHost}${versionManifest?.objectKey ? `/${versionManifest.objectKey}` : ""}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `release publish failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
