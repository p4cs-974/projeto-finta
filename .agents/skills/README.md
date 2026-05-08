# Finta Agent Skills

This directory contains project-level agent skills that can be installed with the skills.sh CLI.

Install the Finta CLI skill from GitHub:

```bash
npx skills add p4cs-974/projeto-finta --skill finta-cli
```

List the skills exposed by a local checkout:

```bash
npx skills add . --list --full-depth
```

The `finta-cli` skill requires agents to use headless Finta CLI commands and avoid the interactive TUI.
