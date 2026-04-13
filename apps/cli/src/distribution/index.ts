import { parseCliArgs, runHeadless } from "../headless/index";
import { CLI_VERSION } from "../version";

function shouldPrintVersion(args: string[]) {
  return (
    args.includes("--version") || args.includes("-v") || args[0] === "version"
  );
}

async function main() {
  const rawArgs = process.argv.slice(2);

  if (shouldPrintVersion(rawArgs)) {
    process.stdout.write(`finta ${CLI_VERSION}\n`);
    return;
  }

  const { command, help } = parseCliArgs(rawArgs);

  if (help || !command) {
    await runHeadless({ name: "help", args: [] });
    return;
  }

  await runHeadless(command);
}

main().catch((error) => {
  process.stderr.write(
    `fatal: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
