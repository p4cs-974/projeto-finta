import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { parseCliArgs, runHeadless } from "./headless/index";
import { loadConfig } from "./api/client";
import { ThemeProvider } from "./theme-provider";
import { App } from "./app";

async function main() {
  const { noUi, json: _, help, command } = parseCliArgs(process.argv.slice(2));

  if (help && !command) {
    await runHeadless({ name: "help", args: [] });
    return;
  }

  if ((noUi || command) && command) {
    await runHeadless(command);
    return;
  }

  const config = await loadConfig();

  const renderer = await createCliRenderer({ exitOnCtrlC: false });

  createRoot(renderer).render(
    <ThemeProvider>
      <App
        initialConfig={config}
      />
    </ThemeProvider>,
  );
}

main().catch((error) => {
  process.stderr.write(`fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
