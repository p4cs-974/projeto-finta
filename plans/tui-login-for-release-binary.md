# Plan: TUI Login Screen for Installed Release Binary

## Problem

The installed release binary (`src/distribution/index.ts`) is headless-only. Running `finta` with no arguments prints help and exits. The TUI login screen only exists in the dev entry point (`src/index.tsx`), which is never compiled into the release artifact.

## Architectural decisions

- **Single entry point**: The release binary (`src/distribution/index.ts`) must be updated to support both TUI and headless modes. No separate binary.
- **Default behavior**: Running `finta` with no arguments launches the TUI. This matches the dev entry point and is the most intuitive default.
- **Headless escape hatch**: `--no-ui` (or any subcommand) continues to work exactly as today for scripting/CI use.
- **Bundling**: The `bun build --compile` step must bundle `@opentui/core`, `@opentui/react`, `react`, and all TSX components into the self-contained binary. These are already production dependencies in `package.json`.
- **No new dependencies**: Everything needed already exists in the codebase.

---

## Phase 1: Merge entry-point logic into the release binary

### What to build

Update `src/distribution/index.ts` to include the TUI branch from `src/index.tsx`: when no command and no `--no-ui` flag is provided, load config, create the CLI renderer, mount the React app. This is the minimal change that makes `finta` (bare) show the TUI.

### Files to change

| File | Change |
|---|---|
| `apps/cli/src/distribution/index.ts` | Add TUI branch: import `createCliRenderer`, `createRoot`, `ThemeProvider`, `App`, `loadConfig`. When no command and no `--no-ui`, launch TUI. Keep existing headless/version/help logic unchanged. |

### Acceptance criteria

- [ ] `finta` (no args) on the release binary launches the TUI auth screen.
- [ ] `finta --no-ui` without a command prints help (unchanged).
- [ ] `finta login`, `finta dashboard`, etc. continue to work headlessly (unchanged).
- [ ] `finta --version` / `finta --help` continue to work (unchanged).
- [ ] `finta` in a pipe or non-TTY environment falls back gracefully (doesn't render TUI when there's no terminal).

### Key considerations

- **TTY detection**: The TUI requires an interactive terminal. Add a `isatty(0)` / `isatty(1)` guard so the binary doesn't attempt to render a TUI when piped (e.g., `echo "" \| finta`). When not a TTY, fall back to printing help.
- **Exit handling**: The TUI already handles Ctrl+C/Ctrl+Q via `useExitHandler` and `exitOnCtrlC: false`. The headless path continues to use `process.exit`.
- The dev entry point (`src/index.tsx`) remains as-is for `bun run dev`.

---

## Phase 2: Verify the release build bundles TUI dependencies

### What to build

Run the release build (`bun run build:release`) and verify the compiled binary includes all React/opentui code and actually renders the TUI when executed.

### Files to change

| File | Change |
|---|---|
| `apps/cli/src/distribution/index.ts` | Ensure the entry point imports TSX files through a path that Bun's bundler can resolve. May need to rename `index.ts` to `index.tsx` or configure the bundler to process `.tsx` imports. |
| `apps/cli/scripts/build-release.ts` | If Bun's `--compile` needs an explicit flag to handle JSX/TSX, add it. Verify the `bun-${target.key}` target resolves all workspace dependencies. |

### Acceptance criteria

- [ ] `bun run build:release` produces binaries that include the TUI code.
- [ ] Running the compiled binary with no args shows the TUI login screen on a real terminal.
- [ ] Binary size is acceptable (baseline: check current size, ensure no pathological growth from duplicate bundling).
- [ ] All existing release tests pass.

### Key considerations

- Bun's `build --compile` bundles everything into a single binary. Since `@opentui/core`, `@opentui/react`, and `react` are already in `dependencies`, they should be included. If not, the bundler entry must be adjusted.
- JSX transformation: Bun handles JSX natively for `.tsx` files, but the entry file is currently `.ts`. Either rename it to `.tsx` (since it will import TSX components) or ensure the bundler is configured to handle JSX in `.ts` files.

---

## Phase 3: Consolidate or remove the dev entry point

### What to build

Now that the release binary has full TUI support, evaluate whether `src/index.tsx` (the dev entry) is still needed or should delegate to `src/distribution/index.ts`.

### Files to change

| File | Change |
|---|---|
| `apps/cli/src/index.tsx` | Update to import from `distribution/index` or simplify to be a thin wrapper. Or remove entirely if `distribution/index.ts` handles both cases. |
| `apps/cli/package.json` | Update `"bin"` and `"dev"` script if entry point changes. |

### Acceptance criteria

- [ ] `bun run dev` (from `apps/cli/`) still launches the TUI.
- [ ] The release build entry point is the sole source of truth for CLI behavior.
- [ ] No duplicated logic between the two entry points.

---

## Phase 4: Update installer next-step guidance

### What to build

The install script and help text currently tell users to run `finta login` (headless). Update messaging to encourage `finta` (TUI) as the primary onboarding path.

### Files to change

| File | Change |
|---|---|
| `packages/cli-distribution/src/index.ts` | Update `renderInstallScript()` next-step messages to say `finta` instead of (or in addition to) `finta login`. |
| `apps/cli/src/headless/index.ts` | Update `printHelp()` to mention that running `finta` with no args opens the interactive TUI. |

### Acceptance criteria

- [ ] After install, the user sees `finta` suggested as the primary next step.
- [ ] `finta --help` mentions the TUI mode.
- [ ] Headless `finta login` remains documented for automation/CI use.
