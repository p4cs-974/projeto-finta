# Finta CLI Release Operations

## Prerequisites

- Cloudflare auth configured for Wrangler.
- `FINTA_RELEASES_BUCKET_NAME` set to the production R2 bucket name.
- The frontend release-storage routes already deployed to production.

## Publish a release

1. Build the release artifacts:

```sh
pnpm --filter @finta/cli build:release -- --version 0.1.0
```

2. Upload versioned artifacts and the version manifest:

```sh
pnpm --filter @finta/cli publish:release -- --version 0.1.0
```

3. Publicly verify the uploaded release before promotion:

```sh
pnpm --filter @finta/cli verify:release -- --version 0.1.0
```

4. Promote the verified version to the stable latest manifest:

```sh
pnpm --filter @finta/cli promote:release -- --version 0.1.0
```

## Roll back

Rollback is a manifest promotion, not an artifact rebuild.

Promote the previously known-good version back to `latest`:

```sh
pnpm --filter @finta/cli promote:release -- --version <previous-version>
```

## Frontend smoke checks

Production frontend deploys should run:

```sh
pnpm --filter frontend-cloudflare smoke:release
```

This checks:

- `https://finta.p4cs.com.br/install.sh`
- `https://finta.p4cs.com.br/releases/latest/manifest.json`

## Notes

- Versioned release objects are immutable and safe to cache aggressively.
- The `latest` manifest is the only mutable alias in the public contract.
- A failed verify step must block promotion.
