# Finta Monorepo - Agent Guide

## Project Overview

**Finta** (FINancial Tracking & Analysis) is a full-stack financial management application built as a Turborepo monorepo.

- **Monorepo Tool**: Turborepo v2.8.3
- **Package Manager**: pnpm v10
- **Structure**: `apps/` (applications) + `packages/` (shared libraries)

## Architecture

```
├── apps/
│   ├── backend-cloudflare/   # Cloudflare Worker API + D1
│   └── frontend-cloudflare/  # Next.js app on Cloudflare Workers
├── packages/        # Shared packages (empty currently)
└── turbo.json       # Task pipeline configuration
```

## Common Commands

Run from the project root:

```bash
# Development - starts all apps in parallel
pnpm run dev

# Build all applications
pnpm run build

# Lint all packages
pnpm run lint

# Run tests across all packages
pnpm run test

# Clean build artifacts
pnpm run clean

# Format code with Prettier
pnpm run format
```

## Task Pipeline

| Task | Depends On | Outputs |
|------|------------|---------|
| `build` | `^build` | `.next/**`, `.open-next/**`, `.wrangler/**`, `dist/**` |
| `dev` | - | persistent, no cache |
| `lint` | `^lint` | - |
| `check` | `^check` | - |
| `type-check` | `^build` | - |

## Conventions

- **TypeScript** is used throughout the monorepo
- **ES Modules** (`"type": "module"`) for all packages
- Import aliases use `"@/"` for local source directories
- Environment variables: `.env`, `.env.local`, `.env.*.local`

## Adding New Packages

1. Create directory under `packages/<name>/`
2. Add `package.json` with proper name and exports
3. Add to `packages` in `pnpm-workspace.yaml` if needed
4. Reference in apps using workspace protocol: `"@finta/<name>": "workspace:*"`

## Important Notes

- `backend-cloudflare` uses Wrangler's local Worker server by default
- `frontend-cloudflare` uses Next.js dev server by default
- Always use `pnpm` commands instead of `npm` or `yarn`
- Turborepo caches build outputs - use `--force` to skip cache if needed

## CLI Release

The CLI release pipeline is local-only (no GitHub Actions). It bumps the version, builds binaries for all platforms, uploads to R2, verifies checksums, promotes to `latest`, and runs smoke tests.

### Prerequisites

- Cloudflare auth configured for Wrangler.
- `FINTA_RELEASES_BUCKET_NAME` set (env var or `--bucket`).
- The frontend release-storage routes already deployed to production.

### How to release

**IMPORTANT:** Before running the release pipeline, ask the user which version bump they want:
- `patch` — bug fixes
- `minor` — new features (backward compatible)
- `major` — breaking changes

Then run from the project root:

```bash
# Interactive: asks for bump type and confirms each step
pnpm run release

# Non-interactive: auto-bump patch and skip confirmations
pnpm run release --patch --yes

# Same for minor / major
pnpm run release --minor --yes
pnpm run release --major --yes

# Dry run: shows what would happen without uploading
pnpm run release --patch --dry-run
```

### Pipeline steps

1. **Bump version** in `apps/cli/package.json`
2. **Build** release artifacts for all platforms
3. **Publish** versioned artifacts and manifest to R2
4. **Verify** uploaded artifacts against checksums
5. **Promote** the version to `latest` manifest alias
6. **Smoke test** frontend release endpoints

### Rollback

Promote a previous version back to latest (no rebuild needed):

```bash
pnpm --filter @finta/cli promote:release -- --version <previous-version>
```
