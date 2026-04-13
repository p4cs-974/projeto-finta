import type { ReleaseManifest } from "../index";

export const latestReleaseManifest: ReleaseManifest = {
  schemaVersion: 1,
  channel: "stable",
  name: "finta",
  version: "0.1.0",
  publishedAt: "2026-04-12T22:00:00.000Z",
  install: {
    command: "curl -fsSL https://finta.p4cs.com.br/install.sh | bash",
    bootstrapUrl: "https://finta.p4cs.com.br/install.sh",
    manifestUrl: "https://finta.p4cs.com.br/releases/latest/manifest.json",
  },
  targets: {
    "darwin-x64": {
      os: "darwin",
      arch: "x64",
      url: "https://finta.p4cs.com.br/releases/0.1.0/finta-darwin-x64",
      sha256:
        "9d82a6332df950e04812e53853604d547948f163f156248cbad2bc464ddafe56",
      size: 64595248,
    },
    "darwin-arm64": {
      os: "darwin",
      arch: "arm64",
      url: "https://finta.p4cs.com.br/releases/0.1.0/finta-darwin-arm64",
      sha256:
        "5b7fe8bd22519fe4ecd3c52301a88d07a9422503cc6cfb7885330a5f48e4dfbe",
      size: 59878704,
    },
    "linux-x64": {
      os: "linux",
      arch: "x64",
      url: "https://finta.p4cs.com.br/releases/0.1.0/finta-linux-x64",
      sha256:
        "0e3bf9232de304dfedbbc9ad6f9b4c2b9cd451b712f4a57300f14b33ce9cb46b",
      size: 102001531,
    },
    "linux-arm64": {
      os: "linux",
      arch: "arm64",
      url: "https://finta.p4cs.com.br/releases/0.1.0/finta-linux-arm64",
      sha256:
        "61bc8c39237686fe1f81cf43c92da9012bdf35043cb2972a92e6afc33545f16d",
      size: 96391541,
    },
  },
};
