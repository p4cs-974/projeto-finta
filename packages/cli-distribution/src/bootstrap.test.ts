import { createHash } from "node:crypto";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

import { createReleaseManifest, renderInstallScript } from "./index";

const execFile = promisify(execFileCallback);

function getCurrentTargetKey() {
  const os =
    process.platform === "darwin"
      ? "darwin"
      : process.platform === "linux"
        ? "linux"
        : null;
  const arch =
    process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "x64" : null;

  if (!os || !arch) {
    throw new Error(
      `Unsupported test platform: ${process.platform}-${process.arch}`,
    );
  }

  return `${os}-${arch}` as const;
}

async function startFixtureServer(options: {
  artifactBody: string;
  sha256?: string;
}) {
  const artifactPath = "/releases/1.2.3/finta-" + getCurrentTargetKey();
  const artifactBuffer = Buffer.from(options.artifactBody);
  const manifest = createReleaseManifest({
    version: "1.2.3",
    publishedAt: "2026-04-12T20:00:00.000Z",
    targets: {
      "darwin-x64": {
        url: "http://127.0.0.1:0/releases/1.2.3/finta-darwin-x64",
        sha256: "a".repeat(64),
        size: 100,
      },
      "darwin-arm64": {
        url: "http://127.0.0.1:0/releases/1.2.3/finta-darwin-arm64",
        sha256: "b".repeat(64),
        size: 100,
      },
      "linux-x64": {
        url: "http://127.0.0.1:0/releases/1.2.3/finta-linux-x64",
        sha256: "c".repeat(64),
        size: 100,
      },
      "linux-arm64": {
        url: "http://127.0.0.1:0/releases/1.2.3/finta-linux-arm64",
        sha256: "d".repeat(64),
        size: 100,
      },
    },
  });
  const targetKey = getCurrentTargetKey();
  const server = createServer((request, response) => {
    if (request.url === "/releases/latest/manifest.json") {
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(manifest, null, 2));
      return;
    }

    if (request.url === artifactPath) {
      response.setHeader("content-type", "application/octet-stream");
      response.end(artifactBuffer);
      return;
    }

    response.statusCode = 404;
    response.end("not found");
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve fixture server address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  manifest.targets[targetKey].url = `${baseUrl}${artifactPath}`;
  manifest.targets[targetKey].sha256 =
    options.sha256 ?? createHash("sha256").update(artifactBuffer).digest("hex");
  manifest.targets[targetKey].size = artifactBuffer.length;

  return {
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

describe("renderInstallScript", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("installs the latest compatible CLI artifact and prints next steps", async () => {
    const workspaceDir = await mkdtemp(join(tmpdir(), "finta-installer-"));
    tempDirs.push(workspaceDir);

    const artifactBody = "#!/usr/bin/env sh\necho 'finta 1.2.3'\n";
    const fixtureServer = await startFixtureServer({ artifactBody });
    const scriptPath = join(workspaceDir, "install.sh");
    const installDir = join(workspaceDir, "bin");

    await writeFile(scriptPath, renderInstallScript(), "utf8");
    await chmod(scriptPath, 0o755);

    const result = await execFile("bash", [scriptPath], {
      cwd: workspaceDir,
      env: {
        ...process.env,
        HOME: workspaceDir,
        FINTA_INSTALL_DIR: installDir,
        FINTA_INSTALL_MANIFEST_URL: `${fixtureServer.baseUrl}/releases/latest/manifest.json`,
      },
    });

    await fixtureServer.close();

    expect(result.stdout).toContain("Finta CLI installer bootstrap");
    expect(result.stdout).toContain("Installed finta 1.2.3");
    expect(result.stdout).toContain("finta --help");
    expect(result.stdout).toContain("\n  finta\n");

    const installedPath = join(installDir, "finta");
    const installedVersion = await execFile(installedPath, ["--version"]);
    expect(installedVersion.stdout.trim()).toBe("finta 1.2.3");
  });

  it("refuses to install when checksum verification fails", async () => {
    const workspaceDir = await mkdtemp(join(tmpdir(), "finta-installer-bad-"));
    tempDirs.push(workspaceDir);

    const fixtureServer = await startFixtureServer({
      artifactBody: "#!/usr/bin/env sh\necho 'finta 1.2.3'\n",
      sha256: "0".repeat(64),
    });
    const scriptPath = join(workspaceDir, "install.sh");
    const installDir = join(workspaceDir, "bin");

    await writeFile(scriptPath, renderInstallScript(), "utf8");
    await chmod(scriptPath, 0o755);

    const failure = await execFile("bash", [scriptPath], {
      cwd: workspaceDir,
      env: {
        ...process.env,
        HOME: workspaceDir,
        FINTA_INSTALL_DIR: installDir,
        FINTA_INSTALL_MANIFEST_URL: `${fixtureServer.baseUrl}/releases/latest/manifest.json`,
      },
    }).catch((error) => error as Error & { stderr: string });

    await fixtureServer.close();

    expect(failure.stderr).toContain("Checksum verification failed");
  });
});
