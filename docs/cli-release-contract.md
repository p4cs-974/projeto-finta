# Finta CLI Release Contract

The public one-line installer has two stable entrypoints:

- Bootstrap script: `https://finta.p4cs.com.br/install.sh`
- Latest manifest: `https://finta.p4cs.com.br/releases/latest/manifest.json`

The canonical install command is:

```sh
curl -fsSL https://finta.p4cs.com.br/install.sh | bash
```

## Manifest shape

The latest release manifest is JSON with this structure:

```json
{
  "schemaVersion": 1,
  "channel": "stable",
  "name": "finta",
  "version": "0.1.0",
  "publishedAt": "2026-04-13T00:37:48.115Z",
  "install": {
    "command": "curl -fsSL https://finta.p4cs.com.br/install.sh | bash",
    "bootstrapUrl": "https://finta.p4cs.com.br/install.sh",
    "manifestUrl": "https://finta.p4cs.com.br/releases/latest/manifest.json"
  },
  "targets": {
    "darwin-x64": {
      "os": "darwin",
      "arch": "x64",
      "url": "https://finta.p4cs.com.br/releases/0.1.0/finta-darwin-x64",
      "sha256": "<sha256>",
      "size": 123
    }
  }
}
```

## Supported targets

- `darwin-x64`
- `darwin-arm64`
- `linux-x64`
- `linux-arm64`

## Release process

Build standalone artifacts and refresh the public manifest plus generated frontend metadata with:

```sh
pnpm --filter @finta/cli build:release
```

Optional flags:

- `--version <semver>` overrides the CLI package version.
- `--published-at <iso8601>` overrides the manifest timestamp.
- `--artifact-base-url <url>` changes the base URL used in the manifest.
- `--targets <csv>` restricts which targets are compiled, for example `darwin-arm64,linux-x64`.

The release build writes:

- `apps/cli/dist/releases/<version>/finta-<os>-<arch>`
- `apps/cli/dist/releases/<version>/manifest.json`
- `apps/cli/dist/releases/latest/manifest.json`
- `packages/cli-distribution/src/generated/latest-release.ts`

The installer contract stays stable as long as the bootstrap URL, manifest URL, and per-target keys remain unchanged.
