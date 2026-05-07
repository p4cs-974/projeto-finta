import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { isatty } from "node:tty";

import { parseCliArgs, runHeadless } from "../headless/index";
import { loadConfig } from "../api/client";
import { CLI_VERSION } from "../version";
import { ThemeProvider } from "../theme-provider";
import { App } from "../app";
import { c } from "../style";

function shouldPrintVersion(args: string[]) {
  return (
    args.includes("--version") || args.includes("-v") || args[0] === "version"
  );
}

function isInteractiveTerminal(): boolean {
  return isatty(0) && isatty(1);
}

async function main() {
  const rawArgs = process.argv.slice(2);

  if (shouldPrintVersion(rawArgs)) {
    process.stdout.write(c.brand("finta") + c.dim(" v" + CLI_VERSION) + "\n");
    return;
  }

  const { noUi, json, help, command } = parseCliArgs(rawArgs);

  if (help && !command) {
    await runHeadless({ name: "help", args: [] }, { json });
    return;
  }

  if (help && command) {
    await runHeadless({ name: "help", args: [command.name] }, { json });
    return;
  }

  if (noUi || command) {
    if (command) {
      await runHeadless(command, { json });
      return;
    }
    await runHeadless({ name: "help", args: [] }, { json });
    return;
  }

  if (!isInteractiveTerminal()) {
    await runHeadless({ name: "help", args: [] }, { json });
    return;
  }

  const config = await loadConfig();

  const renderer = await createCliRenderer({ exitOnCtrlC: false });

  createRoot(renderer).render(
    <ThemeProvider>
      <App initialConfig={config} />
    </ThemeProvider>,
  );
}

main().catch((error) => {
  process.stderr.write(
    c.error("✗") +
      " " +
      (error instanceof Error ? error.message : String(error)) +
      "\n",
  );
  process.exit(1);
});
