import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  chmod,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  CANONICAL_HOST,
  LATEST_MANIFEST_OBJECT_KEY,
  LATEST_RELEASE_CACHE_CONTROL,
  RELEASE_BINARY_CONTENT_TYPE,
  RELEASE_MANIFEST_CONTENT_TYPE,
  RELEASE_TARGETS,
  VERSIONED_RELEASE_CACHE_CONTROL,
  createReleaseManifest,
  getReleaseArtifactObjectKey,
  getReleaseArtifactUrl,
  getReleasePublicUrl,
  getVersionManifestObjectKey,
  getVersionManifestUrl,
  type ReleaseManifest,
  type SupportedTargetKey,
} from "@finta/cli-distribution";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));

export const FRONTEND_WORKER_DIR = resolve(
  here,
  "../../../frontend-cloudflare",
);
export const FRONTEND_WRANGLER_CONFIG = join(
  FRONTEND_WORKER_DIR,
  "wrangler.jsonc",
);

type ReleaseArtifactUpload = {
  kind: "artifact";
  targetKey: SupportedTargetKey;
  objectKey: string;
  publicUrl: string;
  filePath: string;
  sha256: string;
  size: number;
  contentType: string;
  cacheControl: string;
};

type ReleaseManifestUpload = {
  kind: "version-manifest" | "latest-manifest";
  objectKey: string;
  publicUrl: string;
  content: string;
  contentType: string;
  cacheControl: string;
};

export type ReleaseUpload = ReleaseArtifactUpload | ReleaseManifestUpload;

export function parseArgs(argv: string[]) {
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

export function resolveTargetKeys(rawTargetList?: string) {
  const selectedTargets = (rawTargetList?.split(",") ??
    RELEASE_TARGETS.map((target) => target.key)) as SupportedTargetKey[];

  for (const targetKey of selectedTargets) {
    if (!RELEASE_TARGETS.some((target) => target.key === targetKey)) {
      throw new Error(`Unsupported release target: ${targetKey}`);
    }
  }

  return selectedTargets;
}

export function getCurrentTargetKey() {
  const os =
    process.platform === "darwin"
      ? "darwin"
      : process.platform === "linux"
        ? "linux"
        : null;
  const arch =
    process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "x64" : null;

  if (!os || !arch) {
    return null;
  }

  return `${os}-${arch}` as SupportedTargetKey;
}

export function getArtifactPath(
  releasesDir: string,
  version: string,
  targetKey: SupportedTargetKey,
) {
  const target = RELEASE_TARGETS.find(
    (candidate) => candidate.key === targetKey,
  );

  if (!target) {
    throw new Error(`Unsupported release target: ${targetKey}`);
  }

  return join(releasesDir, version, target.artifactName);
}

export async function computeSha256(path: string) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

async function assertFileExists(path: string) {
  try {
    await access(path);
  } catch {
    throw new Error(`Required release artifact is missing: ${path}`);
  }
}

export async function createVersionReleaseArtifacts(input: {
  version: string;
  releasesDir: string;
  publicHost?: string;
  targetKeys: SupportedTargetKey[];
}) {
  const publicHost = input.publicHost ?? CANONICAL_HOST;

  return Object.fromEntries(
    await Promise.all(
      input.targetKeys.map(async (targetKey) => {
        const filePath = getArtifactPath(
          input.releasesDir,
          input.version,
          targetKey,
        );
        await assertFileExists(filePath);
        const content = await readFile(filePath);

        return [
          targetKey,
          {
            url: getReleaseArtifactUrl(input.version, targetKey, publicHost),
            sha256: createHash("sha256").update(content).digest("hex"),
            size: content.byteLength,
            filePath,
          },
        ];
      }),
    ),
  ) as Record<
    SupportedTargetKey,
    { url: string; sha256: string; size: number; filePath: string }
  >;
}

export async function createVersionReleaseManifest(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  publicHost?: string;
  targetKeys: SupportedTargetKey[];
}) {
  const targets = await createVersionReleaseArtifacts(input);

  return createReleaseManifest({
    version: input.version,
    publishedAt: input.publishedAt,
    targets,
  });
}

export async function createVersionReleaseUploads(input: {
  version: string;
  publishedAt: string;
  releasesDir: string;
  publicHost?: string;
  targetKeys: SupportedTargetKey[];
}) {
  const publicHost = input.publicHost ?? CANONICAL_HOST;
  const artifacts = await createVersionReleaseArtifacts(input);
  const manifest = createReleaseManifest({
    version: input.version,
    publishedAt: input.publishedAt,
    targets: artifacts,
  });
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

  const uploads: ReleaseUpload[] = [
    ...input.targetKeys.map((targetKey) => ({
      kind: "artifact" as const,
      targetKey,
      objectKey: getReleaseArtifactObjectKey(input.version, targetKey),
      publicUrl: artifacts[targetKey].url,
      filePath: artifacts[targetKey].filePath,
      sha256: artifacts[targetKey].sha256,
      size: artifacts[targetKey].size,
      contentType: RELEASE_BINARY_CONTENT_TYPE,
      cacheControl: VERSIONED_RELEASE_CACHE_CONTROL,
    })),
    {
      kind: "version-manifest" as const,
      objectKey: getVersionManifestObjectKey(input.version),
      publicUrl: getVersionManifestUrl(input.version, publicHost),
      content: manifestJson,
      contentType: RELEASE_MANIFEST_CONTENT_TYPE,
      cacheControl: VERSIONED_RELEASE_CACHE_CONTROL,
    },
  ];

  return { manifest, manifestJson, uploads };
}

export function createLatestManifestUpload(
  manifest: ReleaseManifest,
  publicHost = CANONICAL_HOST,
): ReleaseManifestUpload {
  return {
    kind: "latest-manifest",
    objectKey: LATEST_MANIFEST_OBJECT_KEY,
    publicUrl: getReleasePublicUrl(LATEST_MANIFEST_OBJECT_KEY, publicHost),
    content: `${JSON.stringify(manifest, null, 2)}\n`,
    contentType: RELEASE_MANIFEST_CONTENT_TYPE,
    cacheControl: LATEST_RELEASE_CACHE_CONTROL,
  };
}

export async function uploadReleaseObject(input: {
  bucketName: string;
  upload: ReleaseUpload;
}) {
  const destination = `${input.bucketName}/${input.upload.objectKey}`;

  if (input.upload.kind === "artifact") {
    await execFileAsync(
      "pnpm",
      [
        "--dir",
        FRONTEND_WORKER_DIR,
        "exec",
        "wrangler",
        "r2",
        "object",
        "put",
        destination,
        "--remote",
        "--file",
        input.upload.filePath,
        "--content-type",
        input.upload.contentType,
        "--cache-control",
        input.upload.cacheControl,
      ],
      {
        cwd: FRONTEND_WORKER_DIR,
        env: process.env,
      },
    );
    return;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "finta-release-upload-"));
  const tempFile = join(tempDir, "payload");

  try {
    await writeFile(tempFile, input.upload.content, "utf8");
    await execFileAsync(
      "pnpm",
      [
        "--dir",
        FRONTEND_WORKER_DIR,
        "exec",
        "wrangler",
        "r2",
        "object",
        "put",
        destination,
        "--remote",
        "--file",
        tempFile,
        "--content-type",
        input.upload.contentType,
        "--cache-control",
        input.upload.cacheControl,
      ],
      {
        cwd: FRONTEND_WORKER_DIR,
        env: process.env,
      },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function fetchReleaseManifest(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Release manifest request failed with status ${response.status} for ${url}`,
    );
  }

  const payload = (await response.json()) as ReleaseManifest;

  if (typeof payload.version !== "string" || !payload.targets) {
    throw new Error(`Release manifest from ${url} is invalid`);
  }

  return payload;
}

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}

async function verifyBinaryVersionByExecution(path: string, version: string) {
  await chmod(path, 0o755);
  const result = await execFileAsync(path, ["--version"]);
  const actualVersion = stripAnsi(result.stdout.trim());

  // Accept both "finta 0.2.0" and "finta v0.2.0"
  const expectedPlain = `finta ${version}`;
  const expectedWithV = `finta v${version}`;

  if (actualVersion !== expectedPlain && actualVersion !== expectedWithV) {
    throw new Error(
      `Version check failed for ${path}: expected "${expectedPlain}" or "${expectedWithV}" but got "${actualVersion}"`,
    );
  }
}

async function verifyBinaryVersionByEmbeddedString(
  path: string,
  version: string,
) {
  try {
    const result = await execFileAsync("strings", [path], {
      maxBuffer: 20 * 1024 * 1024,
    });

    // The binary may contain colored output; search for the plain version string
    if (!result.stdout.includes(version)) {
      throw new Error(
        `Artifact ${path} does not contain the expected version marker "${version}"`,
      );
    }
  } catch (error) {
    throw new Error(
      `Unable to inspect non-native artifact ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function verifyDownloadedArtifact(input: {
  artifactUrl: string;
  expectedSha256: string;
  expectedVersion: string;
  targetKey: SupportedTargetKey;
}) {
  const tempDir = await mkdtemp(join(tmpdir(), "finta-release-verify-"));
  const artifactPath = join(tempDir, "finta");

  try {
    const response = await fetch(input.artifactUrl);

    if (!response.ok) {
      throw new Error(
        `Artifact request failed with status ${response.status} for ${input.artifactUrl}`,
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(artifactPath, bytes);

    const actualSha256 = await computeSha256(artifactPath);
    if (actualSha256 !== input.expectedSha256) {
      throw new Error(
        `Checksum verification failed for ${input.artifactUrl}: expected ${input.expectedSha256}, got ${actualSha256}`,
      );
    }

    if (input.targetKey === getCurrentTargetKey()) {
      await verifyBinaryVersionByExecution(artifactPath, input.expectedVersion);
    } else {
      await verifyBinaryVersionByEmbeddedString(
        artifactPath,
        input.expectedVersion,
      );
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
