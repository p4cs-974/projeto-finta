import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  api,
  clearConfig,
  isRevokedKeyError,
  loadConfig,
  saveConfig,
  toStoredCliConfig,
} from "../api/client";

function printJson(data: unknown) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function printError(error: unknown) {
  if (isRevokedKeyError(error)) {
    process.stderr.write(
      "error: your stored API key is invalid or was revoked. Run `finta login`.\n",
    );
  } else if (error instanceof Error) {
    process.stderr.write(`error: ${error.message}\n`);
  } else {
    process.stderr.write(`error: ${String(error)}\n`);
  }
  process.exit(1);
}

type Command = {
  name: string;
  args: string[];
};

function printHelp() {
  process.stdout.write(
    [
      "Usage: finta [--no-ui] <command> [options]",
      "",
      "Run finta with no arguments to open the interactive TUI.",
      "",
      "Commands:",
      "  login [--email <email>] [--password <password>]",
      "  register [--name <name>] [--email <email>] [--password <password>]",
      "  logout",
      "  keys",
      "  dashboard",
      "  favorites [list|add|remove]",
      "  quote <ticker>",
      "  search <query> [type]",
    ].join("\n") + "\n",
  );
}

function parseArgs(raw: string[]): {
  noUi: boolean;
  json: boolean;
  help: boolean;
  command?: Command;
} {
  let noUi = false;
  let json = false;
  let help = false;
  const positional: string[] = [];

  for (const arg of raw) {
    if (arg === "--no-ui" || arg === "--headless") {
      noUi = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--help" || arg === "-h") {
      help = true;
    } else {
      positional.push(arg);
    }
  }

  const command =
    positional.length > 0
      ? { name: positional[0]!, args: positional.slice(1) }
      : undefined;

  return { noUi, json, help, command };
}

function parseNamedArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index]!;

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      process.stderr.write(`missing value for flag: ${current}\n`);
      process.exit(1);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

async function promptFor(field: string): Promise<string> {
  const rl = createInterface({ input, output });

  try {
    return (await rl.question(`${field}: `)).trim();
  } finally {
    rl.close();
  }
}

async function requireApiKey(): Promise<string> {
  const config = await loadConfig();
  if (!config?.apiKey) {
    process.stderr.write("not logged in. run: finta login\n");
    process.exit(1);
  }

  return config.apiKey;
}

async function handleLogin(args: string[]) {
  const flags = parseNamedArgs(args);
  const email = flags.email ?? (await promptFor("Email"));
  const password = flags.password ?? (await promptFor("Password"));
  const result = await api.auth.login(email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  printJson({ status: "ok", user: result.data.user, keyName: config.keyName });
}

async function handleRegister(args: string[]) {
  const flags = parseNamedArgs(args);
  const name = flags.name ?? (await promptFor("Name"));
  const email = flags.email ?? (await promptFor("Email"));
  const password = flags.password ?? (await promptFor("Password"));
  const result = await api.auth.register(name, email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  printJson({ status: "ok", user: result.data.user, keyName: config.keyName });
}

async function handleLogout() {
  const config = await loadConfig();

  if (!config) {
    process.stdout.write("Not currently authenticated. Run `finta login` to log in.\n");
    return;
  }

  await api.auth.logout(config.apiKey, config.keyId);
  await clearConfig();
  printJson({ status: "ok" });
}

async function handleKeys() {
  const token = await requireApiKey();
  const data = await api.auth.keys(token);
  printJson(data);
}

async function handleDashboard() {
  const token = await requireApiKey();
  const data = await api.dashboard.get(token);
  printJson(data);
}

async function handleFavorites(args: string[]) {
  const token = await requireApiKey();
  const subcommand = args[0];

  if (!subcommand || subcommand === "list") {
    const data = await api.favorites.list(token);
    printJson(data);
    return;
  }

  if (subcommand === "add") {
    const [symbol, assetType] = args.slice(1);
    if (!symbol || !assetType) {
      process.stderr.write("usage: finta favorites add <symbol> <assetType>\n");
      process.exit(1);
    }
    const data = await api.favorites.add(token, symbol, assetType);
    printJson(data);
    return;
  }

  if (subcommand === "remove") {
    const [symbol, assetType] = args.slice(1);
    if (!symbol || !assetType) {
      process.stderr.write(
        "usage: finta favorites remove <symbol> <assetType>\n",
      );
      process.exit(1);
    }
    const data = await api.favorites.remove(token, symbol, assetType);
    printJson(data);
    return;
  }

  process.stderr.write(`unknown subcommand: ${subcommand}\n`);
  process.exit(1);
}

async function handleQuote(args: string[]) {
  const token = await requireApiKey();
  const [ticker] = args;

  if (!ticker) {
    process.stderr.write("usage: finta quote <ticker>\n");
    process.exit(1);
  }
  const data = await api.quotes.get(token, ticker);
  printJson(data);
}

async function handleSearch(args: string[]) {
  const token = await requireApiKey();
  const [query, type] = args;

  if (!query) {
    process.stderr.write("usage: finta search <query> [type]\n");
    process.exit(1);
  }
  const data = await api.quotes.search(token, query, type);
  printJson(data);
}

const commands: Record<string, (args: string[]) => Promise<void>> = {
  login: handleLogin,
  register: handleRegister,
  logout: handleLogout,
  keys: handleKeys,
  dashboard: handleDashboard,
  favorites: handleFavorites,
  quote: handleQuote,
  search: handleSearch,
  help: async () => printHelp(),
};

export function parseCliArgs(argv: string[]) {
  return parseArgs(argv);
}

export async function runHeadless(command: Command) {
  try {
    const handler = commands[command.name];
    if (!handler) {
      process.stderr.write(`unknown command: ${command.name}\n`);
      printHelp();
      process.exit(1);
    }
    await handler(command.args);
  } catch (error) {
    printError(error);
  }
}
