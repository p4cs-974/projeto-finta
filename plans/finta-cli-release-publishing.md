# Plan: Finta CLI Release Publishing

> Source PRD: [docs/prd-cli-install-script.md](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/docs/prd-cli-install-script.md)

## Architectural decisions

Durable decisions that apply across all phases:

- **Bootstrap URL**: `GET https://finta.p4cs.com.br/install.sh` remains the canonical public entrypoint for installation.
- **Release source of truth**: Published CLI releases live in durable object storage, not in the frontend application bundle.
- **Manifest ownership**: The latest release manifest is generated from the uploaded artifacts and served from release storage, with the frontend acting at most as a thin proxy or redirector.
- **Publishing model**: CLI release publishing is a dedicated pipeline, separate from `frontend-cloudflare` deploys. A frontend deploy must not be required to ship a new CLI version.
- **Promotion model**: Versioned artifacts are uploaded first, validated publicly, and only then promoted to the `latest` manifest.
- **Task model**: Release build, publish, verify, and promote steps live as package-level tasks in the CLI package and are orchestrated through Turborepo instead of ad hoc root scripts.
- **Storage layout**: Public release storage uses durable versioned paths for artifacts and manifests, plus a `latest` alias for stable installs.
- **Supported targets**: v1 continues to support macOS and Linux on `x64` and `arm64`.
- **Trust model**: Installer integrity checks remain checksum-based, with checksums derived from the exact uploaded binaries.
- **Operational boundary**: Frontend deploys may verify installer reachability, but they do not define or publish CLI release state.

---

## Phase 1: Release Storage Contract

**User stories**: 11, 12, 13, 14, 15

### What to build

Establish the durable public release surface that will outlive frontend implementation changes. This slice defines where versioned artifacts live, where manifests live, how the public URLs map to storage, and what “published” means operationally.

### Acceptance criteria

- [ ] A durable public storage location exists for CLI artifacts and manifests.
- [ ] Versioned release paths are defined for binaries and per-version manifests.
- [ ] A stable `latest` manifest path is defined for installer resolution.
- [ ] The storage-backed release contract is documented well enough that future releases do not depend on frontend bundle internals.
- [ ] The chosen public URL pattern supports keeping `https://finta.p4cs.com.br/install.sh` stable even if storage implementation changes later.

---

## Phase 2: Dedicated CLI Publish Pipeline

**User stories**: 13, 14, 15, 18

### What to build

Create a dedicated CLI release pipeline that builds all supported binaries, computes checksums, uploads them to release storage, and generates the release manifest from the uploaded artifacts’ real public URLs. This slice gives the CLI an independent shipping path.

### Acceptance criteria

- [ ] The CLI package exposes package-level tasks for release build and release publish.
- [ ] The publish flow uploads all supported target binaries to versioned storage paths.
- [ ] The manifest is generated from the uploaded artifact URLs rather than from assumed local paths.
- [ ] The publish flow fails if any required target artifact is missing or any upload step fails.
- [ ] Running the publish flow for a new version does not require a frontend deploy.

---

## Phase 3: Storage-Backed Manifest Resolution

**User stories**: 1, 12, 13, 15, 16

### What to build

Replace the frontend-owned “latest release” data with a storage-backed resolution path. The public installer continues to resolve through the canonical domain, but the manifest returned to users is sourced from release storage rather than from code committed into the frontend app.

### Acceptance criteria

- [ ] The public latest manifest endpoint resolves to storage-backed release data.
- [ ] The frontend no longer hardcodes the latest release manifest into the application bundle.
- [ ] The bootstrap script continues to work without changing the public install command.
- [ ] Logged-out users and automation can still fetch the installer and latest manifest without redirects or authentication.
- [ ] The production manifest response reflects the currently promoted release without rebuilding the frontend application.

---

## Phase 4: Verification and Promotion Gate

**User stories**: 4, 10, 11, 17, 18

### What to build

Add a promotion gate between “artifacts uploaded” and “release is latest.” This slice publicly verifies every uploaded artifact and manifest URL, validates checksums against the uploaded files, and only then promotes the new release to the stable latest path consumed by the installer.

### Acceptance criteria

- [ ] Newly uploaded versioned artifacts are publicly reachable before promotion.
- [ ] Release verification confirms each uploaded binary matches the checksum published in the manifest.
- [ ] Release verification confirms each uploaded binary reports the expected CLI version.
- [ ] The latest manifest is updated only after all verification checks succeed.
- [ ] A failed publish attempt does not replace the previously working latest release.

---

## Phase 5: Deploy Separation and Operational Safeguards

**User stories**: 6, 7, 9, 10, 16, 17, 19, 20

### What to build

Finish the architecture by separating responsibilities across deploy surfaces and adding smoke checks that catch regressions before users do. Frontend deploys verify the public bootstrap path and manifest reachability, while the CLI release pipeline owns artifact publication, promotion, and release health.

### Acceptance criteria

- [ ] Frontend deploys do not build or publish CLI binaries as part of their normal deploy path.
- [ ] Frontend deploys include smoke checks for `/install.sh` and the public latest manifest endpoint.
- [ ] CLI release publishes include smoke checks for every manifest target URL before promoting latest.
- [ ] Operational documentation explains how to publish, verify, promote, and roll back a CLI release.
- [ ] A broken frontend deploy cannot silently invalidate previously published CLI binaries, and a broken CLI release cannot silently publish a manifest for missing artifacts.

