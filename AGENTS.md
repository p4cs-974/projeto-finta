# Finta Monorepo - Agent Guide

## Project Overview

**Finta** (FINancial Tracking & Analysis) is a full-stack financial management application built as a Turborepo monorepo.

- **Monorepo Tool**: Turborepo v2.8.3
- **Package Manager**: Bun v1.3.6
- **Structure**: `apps/` (applications) + `packages/` (shared libraries)

## Architecture

```
├── apps/
│   ├── backend/     # Elysia API server (Bun runtime)
│   └── frontend/    # React SPA (Vite + Tailwind CSS v4)
├── packages/        # Shared packages (empty currently)
└── turbo.json       # Task pipeline configuration
```

## Common Commands

Run from the project root:

```bash
# Development - starts all apps in parallel
bun run dev

# Build all applications
bun run build

# Lint all packages
bun run lint

# Run tests across all packages
bun run test

# Clean build artifacts
bun run clean

# Format code with Prettier
bun run format
```

## Task Pipeline

| Task | Depends On | Outputs |
|------|------------|---------|
| `build` | `^build` | `.next/**`, `dist/**` |
| `dev` | - | persistent, no cache |
| `lint` | `^lint` | - |
| `type-check` | `^build` | - |

## Conventions

- **TypeScript** is used throughout the monorepo
- **ES Modules** (`"type": "module"`) for all packages
- Import aliases use `"@/"` for local source directories
- Environment variables: `.env`, `.env.local`, `.env.*.local`

## Adding New Packages

1. Create directory under `packages/<name>/`
2. Add `package.json` with proper name and exports
3. Add to `workspaces` in root `package.json` if needed
4. Reference in apps using workspace protocol: `"@finta/<name>": "workspace:*"`

## Important Notes

- Backend runs on **port 3000** by default
- Frontend runs on **port 5173** by default
- Always use `bun` commands instead of `npm` or `yarn`
- Turborepo caches build outputs - use `--force` to skip cache if needed
