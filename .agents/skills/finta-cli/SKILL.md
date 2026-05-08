---
name: finta-cli
description: Use the Finta CLI safely from agents with mandatory headless commands, authentication, quotes, dashboard, API keys, and favorites management. Use when invoking `finta`, testing CLI behavior, scripting Finta financial workflows, or working in `apps/cli`; agents must never launch the interactive TUI.
---

# Finta CLI

## Non-Negotiable Rule

Agents must use headless CLI commands only. Never launch the interactive TUI.

Always pass a command and include `--headless` or `--no-ui` explicitly:

```bash
finta --headless <command> [args]
```

Do not run plain `finta`, because that can open the OpenTUI app.

## Invocation

Use the installed `finta` CLI first. Only use the repo `pnpm --filter @finta/cli dev --` command when developing the CLI source itself or when the installed binary is unavailable.

```bash
finta --headless --help
finta --headless quote AAPL --type stock
finta --headless search bitcoin crypto
```

Development fallback from the repository root:

```bash
pnpm --filter @finta/cli dev -- --headless quote AAPL --type stock
```

## Environment

The CLI defaults to the production API at `https://api.finta.p4cs.com.br`.

Set `FINTA_API_URL=http://localhost:8787` only when intentionally targeting a local backend.

Use task-specific config for tests or automation so agents do not overwrite a human user's `~/.finta/config.json`.

```bash
FINTA_API_URL=http://localhost:8787
FINTA_CONFIG_DIR=/tmp/finta-cli-agent
FINTA_CLI_RATE_LIMIT_MAX_REQUESTS=30
FINTA_CLI_RATE_LIMIT_WINDOW_MS=60000
```

## Authentication

Prefer non-interactive auth flags. Do not rely on prompts.

```bash
finta --headless login --email user@example.com --password "$FINTA_PASSWORD"
finta --headless register --name "Agent User" --email user@example.com --password "$FINTA_PASSWORD"
finta --headless logout
finta --headless keys
```

Never print real passwords or API keys in final responses. If a command returns secrets, summarize that authentication succeeded and omit secret values.

## Data Commands

Use JSON output when a command supports it and the result will be parsed by an agent or script. `assetType` values are `stock` or `crypto`.

```bash
finta --headless dashboard --json
finta --headless favorites list
finta --headless favorites add AAPL stock
finta --headless favorites add BTC crypto
finta --headless favorites remove AAPL stock
finta --headless quote PETR4 --type stock
finta --headless search petrobras stock
```

## Verification Workflow

When changing CLI behavior:

1. Add or update focused tests under `apps/cli/src`.
2. Run `pnpm --filter @finta/cli test`.
3. Run `pnpm --filter @finta/cli type-check`.
4. Smoke the command with `--headless --help` or the changed command.

Use root `pnpm run test` or `pnpm run type-check` only when the change touches shared packages or cross-package behavior.

## Error Handling

If the CLI says "Not logged in", authenticate headlessly or set `FINTA_CONFIG_DIR` to a directory containing a valid config.

If the CLI says an API key was revoked, run headless `login` again.

If rate limited, wait for the retry window or use a fresh task-specific `FINTA_CONFIG_DIR` only when the scenario truly needs isolated state.
