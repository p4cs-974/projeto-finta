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
