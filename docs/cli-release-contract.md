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

## Public release storage

Published CLI releases live in durable object storage and are exposed through the
canonical frontend domain:

- Version manifest: `https://finta.p4cs.com.br/releases/<version>/manifest.json`
- Version artifact: `https://finta.p4cs.com.br/releases/<version>/finta-<os>-<arch>`
- Latest manifest alias: `https://finta.p4cs.com.br/releases/latest/manifest.json`

The frontend Worker is only a thin public read layer over storage for `/releases/...`.
A frontend rebuild is not required to publish or promote a new CLI version once the
route contract is deployed.

## Release process

The CLI release pipeline is package-scoped and runs from `apps/cli` through Turborepo
tasks:

```sh
pnpm --filter @finta/cli build:release -- --version 0.1.0
pnpm --filter @finta/cli publish:release -- --version 0.1.0 --bucket finta-cli-releases
pnpm --filter @finta/cli verify:release -- --version 0.1.0
pnpm --filter @finta/cli promote:release -- --version 0.1.0 --bucket finta-cli-releases
```

Optional flags:

- `--version <semver>` overrides the CLI package version.
- `--published-at <iso8601>` overrides the manifest timestamp.
- `--public-host <url>` changes the canonical host used in generated public URLs.
- `--bucket <name>` overrides `FINTA_RELEASES_BUCKET_NAME` for publish/promote steps.
- `--targets <csv>` restricts which targets are compiled, for example `darwin-arm64,linux-x64`.

Environment variables:

- `FINTA_RELEASES_BUCKET_NAME` is required for publish and promote.
- `FINTA_PUBLIC_HOST` can override the canonical public host for smoke checks.

The release build writes local versioned outputs:

- `apps/cli/dist/releases/<version>/finta-<os>-<arch>`
- `apps/cli/dist/releases/<version>/manifest.json`

The publish step uploads versioned artifacts plus the version manifest to R2. The
verify step checks the public version manifest and every public artifact URL before
promotion. The promote step updates only the `latest` manifest alias, so a failed
publish cannot replace the previously working latest release.

Frontend deploys should run:

```sh
pnpm --filter frontend-cloudflare smoke:release
```

This validates `/install.sh` and `/releases/latest/manifest.json` on the public host.

The installer contract stays stable as long as the bootstrap URL, latest manifest
URL, and per-target keys remain unchanged.
