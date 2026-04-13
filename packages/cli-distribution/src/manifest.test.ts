import { describe, expect, it } from "vitest";

import {
  CANONICAL_BOOTSTRAP_URL,
  CANONICAL_INSTALL_COMMAND,
  CANONICAL_MANIFEST_URL,
  RELEASE_TARGETS,
  createReleaseManifest,
} from "./index";

describe("CLI distribution contract", () => {
  it("publishes one canonical install command on the public production domain", () => {
    expect(CANONICAL_BOOTSTRAP_URL).toBe(
      "https://finta.p4cs.com.br/install.sh",
    );
    expect(CANONICAL_MANIFEST_URL).toBe(
      "https://finta.p4cs.com.br/releases/latest/manifest.json",
    );
    expect(CANONICAL_INSTALL_COMMAND).toBe(
      "curl -fsSL https://finta.p4cs.com.br/install.sh | bash",
    );
  });

  it("builds a latest-stable manifest for every supported target", () => {
    const manifest = createReleaseManifest({
      version: "1.2.3",
      publishedAt: "2026-04-12T18:30:00.000Z",
      targets: {
        "darwin-x64": {
          url: "https://downloads.finta.test/releases/1.2.3/finta-darwin-x64",
          sha256: "a".repeat(64),
          size: 101,
        },
        "darwin-arm64": {
          url: "https://downloads.finta.test/releases/1.2.3/finta-darwin-arm64",
          sha256: "b".repeat(64),
          size: 102,
        },
        "linux-x64": {
          url: "https://downloads.finta.test/releases/1.2.3/finta-linux-x64",
          sha256: "c".repeat(64),
          size: 103,
        },
        "linux-arm64": {
          url: "https://downloads.finta.test/releases/1.2.3/finta-linux-arm64",
          sha256: "d".repeat(64),
          size: 104,
        },
      },
    });

    expect(Object.keys(manifest.targets)).toEqual(
      RELEASE_TARGETS.map((target) => target.key),
    );
    expect(manifest).toEqual({
      schemaVersion: 1,
      channel: "stable",
      name: "finta",
      version: "1.2.3",
      publishedAt: "2026-04-12T18:30:00.000Z",
      install: {
        command: CANONICAL_INSTALL_COMMAND,
        bootstrapUrl: CANONICAL_BOOTSTRAP_URL,
        manifestUrl: CANONICAL_MANIFEST_URL,
      },
      targets: {
        "darwin-x64": {
          os: "darwin",
          arch: "x64",
          url: "https://downloads.finta.test/releases/1.2.3/finta-darwin-x64",
          sha256: "a".repeat(64),
          size: 101,
        },
        "darwin-arm64": {
          os: "darwin",
          arch: "arm64",
          url: "https://downloads.finta.test/releases/1.2.3/finta-darwin-arm64",
          sha256: "b".repeat(64),
          size: 102,
        },
        "linux-x64": {
          os: "linux",
          arch: "x64",
          url: "https://downloads.finta.test/releases/1.2.3/finta-linux-x64",
          sha256: "c".repeat(64),
          size: 103,
        },
        "linux-arm64": {
          os: "linux",
          arch: "arm64",
          url: "https://downloads.finta.test/releases/1.2.3/finta-linux-arm64",
          sha256: "d".repeat(64),
          size: 104,
        },
      },
    });
  });
});
