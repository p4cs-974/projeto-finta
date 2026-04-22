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
import { CLI_VERSION } from "../version";
import { c, box } from "../style";

type QuoteApiResponse = {
  data: {
    ticker?: string;
    symbol?: string;
    name: string;
    market?: string;
    currency: string;
    price: number;
    change: number;
    changePercent: number;
    quotedAt: string;
    logoUrl?: string | null;
  };
  cache: {
    key: string;
    updatedAt: string;
    stale: boolean;
    source: "cache" | "live";
  };
};

function printJson(data: unknown) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function printError(error: unknown) {
  if (isRevokedKeyError(error)) {
    process.stderr.write(
      c.error("✗") +
        " Your stored API key is invalid or was revoked.\n  Run " +
        c.code("finta login") +
        " to authenticate.\n",
    );
  } else if (error instanceof Error) {
    process.stderr.write(c.error("✗") + " " + error.message + "\n");
  } else {
    process.stderr.write(c.error("✗") + " " + String(error) + "\n");
  }
  process.exit(1);
}

type Command = {
  name: string;
  args: string[];
};

/* ─────────────────────────── Help system ─────────────────────────── */

type CommandHelp = {
  description: string;
  usage: string;
  examples: string[];
};

const commandHelps: Record<string, CommandHelp> = {
  login: {
    description: "Authenticate with your Finta account.",
    usage: "finta login [--email <email>] [--password <password>]",
    examples: [
      "finta login",
      "finta login --email you@example.com --password secret",
    ],
  },
  register: {
    description: "Create a new Finta account.",
    usage:
      "finta register [--name <name>] [--email <email>] [--password <password>]",
    examples: [
      "finta register",
      "finta register --name \"John Doe\" --email you@example.com --password secret",
    ],
  },
  logout: {
    description: "Remove local authentication and delete stored API key.",
    usage: "finta logout",
    examples: ["finta logout"],
  },
  keys: {
    description: "List your active API keys.",
    usage: "finta keys",
    examples: ["finta keys"],
  },
  dashboard: {
    description: "Show your asset dashboard with latest quotes.",
    usage: "finta dashboard",
    examples: ["finta dashboard"],
  },
  favorites: {
    description: "Manage your favorite assets.",
    usage: "finta favorites [list | add <symbol> <assetType> | remove <symbol> <assetType>]",
    examples: [
      "finta favorites",
      "finta favorites list",
      "finta favorites add AAPL stock",
      "finta favorites add BTC crypto",
      "finta favorites remove AAPL stock",
    ],
  },
  quote: {
    description: "Get a real-time price quote for an asset.",
    usage: "finta quote <ticker> [--type <stock|crypto>]",
    examples: [
      "finta quote AAPL",
      "finta quote BTC --type crypto",
      "finta quote PETR4 --type stock",
    ],
  },
  search: {
    description: "Search for assets by name or ticker.",
    usage: "finta search <query> [type]",
    examples: [
      "finta search apple",
      "finta search bitcoin crypto",
      "finta search petrobras stock",
    ],
  },
};

function printHeader(): string {
  return box([
    c.brand("finta") + c.dim("  v" + CLI_VERSION),
    c.dim("FINancial Tracking & Analysis"),
  ]);
}

function printGlobalHelp() {
  const lines: string[] = [
    printHeader(),
    "",
    c.heading("Usage"),
    "  " + c.code("$ finta <command> [options]"),
    "",
    "  Run with no arguments to launch the interactive TUI.",
    "",
    c.heading("Global Options"),
    "  " + c.code("--no-ui, --headless".padEnd(22)) + "  Force headless mode (no TUI)",
    "  " + c.code("--json".padEnd(22)) + "  Output raw JSON instead of formatted text",
    "  " + c.code("--help, -h".padEnd(22)) + "  Show help",
    "  " + c.code("--version, -v".padEnd(22)) + "  Show version",
    "",
    c.heading("Commands"),
  ];

  const maxNameLen = Math.max(
    ...Object.keys(commandHelps).map((name) => name.length),
  );

  for (const [name, help] of Object.entries(commandHelps)) {
    lines.push(
      "  " +
        c.code(name.padEnd(maxNameLen)) +
        "  " +
        c.dim(help.description),
    );
  }

  lines.push(
    "",
    c.heading("Examples"),
    "  " + c.code("$ finta"),
    "  " + c.code("$ finta login"),
    "  " + c.code("$ finta quote AAPL"),
    "  " + c.code("$ finta search apple"),
    "  " + c.code("$ finta favorites add BTC crypto"),
    "",
    c.tip("Tip:") + " Use " + c.code("finta <command> --help") + " for details on a specific command.",
    "",
  );

  process.stdout.write(lines.join("\n"));
}

function printCommandHelp(commandName: string) {
  const help = commandHelps[commandName];
  if (!help) {
    process.stderr.write(
      c.error("✗") + " Unknown command: " + c.code(commandName) + "\n",
    );
    printGlobalHelp();
    process.exit(1);
  }

  const lines: string[] = [
    printHeader(),
    "",
    c.heading("Command"),
    "  " + c.brand(commandName),
    "",
    c.heading("Description"),
    "  " + help.description,
    "",
    c.heading("Usage"),
    "  " + c.code(help.usage),
    "",
    c.heading("Examples"),
  ];

  for (const ex of help.examples) {
    lines.push("  " + c.code("$ " + ex));
  }

  lines.push("");
  process.stdout.write(lines.join("\n"));
}

function printHelp(commandName?: string) {
  if (commandName) {
    printCommandHelp(commandName);
  } else {
    printGlobalHelp();
  }
}

/* ─────────────────────────── Args parsing ─────────────────────────── */

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
      process.stderr.write(
        c.error("✗") +
          " Missing value for flag " +
          c.code(current) +
          "\n  Example: " +
          c.code(`${current} <value>`) +
          "\n",
      );
      process.exit(1);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function parseAssetTypeFlag(
  rawType: string | undefined,
): "stock" | "crypto" | undefined {
  if (!rawType) {
    return undefined;
  }

  if (rawType === "stock" || rawType === "crypto") {
    return rawType;
  }

  process.stderr.write(
    c.error("✗") +
      " Invalid --type value: " +
      c.code(rawType) +
      "\n  Expected: " +
      c.code("stock") +
      " | " +
      c.code("crypto") +
      "\n",
  );
  process.exit(1);
}

function formatSignedNumber(value: number, digits = 2) {
  const formatted = value.toFixed(digits);
  if (value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

function printQuoteDetails(payload: QuoteApiResponse) {
  const quote = payload.data;
  const symbol = quote.ticker ?? quote.symbol ?? "-";
  const market = quote.market ?? "CRYPTO";
  const staleLabel = payload.cache.stale ? c.tip("yes") : c.success("no");

  const changeColor = quote.change >= 0 ? c.success : c.error;

  process.stdout.write(
    [
      c.heading("Asset"),
      "  " + c.brand(symbol) + "  " + c.dim(quote.name),
      "",
      c.heading("Market"),
      "  " + market,
      "",
      c.heading("Price"),
      "  " +
        quote.currency +
        " " +
        quote.price.toFixed(2) +
        "  " +
        changeColor(
          `${formatSignedNumber(quote.change)} (${formatSignedNumber(
            quote.changePercent,
          )}%)`,
        ),
      "",
      c.heading("Quote Info"),
      "  Quoted at:   " + quote.quotedAt,
      "  Source:      " + payload.cache.source,
      "  Stale:       " + staleLabel,
      "",
      c.dim("Cache key:      " + payload.cache.key),
      c.dim("Cache updated:  " + payload.cache.updatedAt),
      "",
    ].join("\n"),
  );
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
    process.stderr.write(
      c.error("✗") +
        " Not logged in.\n  Run " +
        c.code("finta login") +
        " to authenticate.\n",
    );
    process.exit(1);
  }

  return config.apiKey;
}

/* ─────────────────────────── Handlers ─────────────────────────── */

async function handleLogin(args: string[]) {
  const flags = parseNamedArgs(args);
  const email = flags.email ?? (await promptFor("Email"));
  const password = flags.password ?? (await promptFor("Password"));
  const result = await api.auth.login(email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  process.stdout.write(
    c.success("✓") +
      " Logged in as " +
      c.brand(result.data.user.name) +
      "\n  Key: " +
      c.code(config.keyName) +
      "\n",
  );
}

async function handleRegister(args: string[]) {
  const flags = parseNamedArgs(args);
  const name = flags.name ?? (await promptFor("Name"));
  const email = flags.email ?? (await promptFor("Email"));
  const password = flags.password ?? (await promptFor("Password"));
  const result = await api.auth.register(name, email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  process.stdout.write(
    c.success("✓") +
      " Registered and logged in as " +
      c.brand(result.data.user.name) +
      "\n  Key: " +
      c.code(config.keyName) +
      "\n",
  );
}

async function handleLogout() {
  const config = await loadConfig();

  if (!config) {
    process.stdout.write(
      c.tip("!") +
        " Not currently authenticated.\n  Run " +
        c.code("finta login") +
        " to log in.\n",
    );
    return;
  }

  await api.auth.logout(config.apiKey, config.keyId);
  await clearConfig();
  process.stdout.write(c.success("✓") + " Logged out.\n");
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
      process.stderr.write(
        c.error("✗") +
          " Missing arguments.\n  Usage: " +
          c.code("finta favorites add <symbol> <assetType>") +
          "\n  Example: " +
          c.code("finta favorites add AAPL stock") +
          "\n",
      );
      process.exit(1);
    }
    const data = await api.favorites.add(token, symbol, assetType);
    process.stdout.write(
      c.success("✓") +
        " Added " +
        c.brand(symbol) +
        " (" +
        assetType +
        ") to favorites.\n",
    );
    printJson(data);
    return;
  }

  if (subcommand === "remove") {
    const [symbol, assetType] = args.slice(1);
    if (!symbol || !assetType) {
      process.stderr.write(
        c.error("✗") +
          " Missing arguments.\n  Usage: " +
          c.code("finta favorites remove <symbol> <assetType>") +
          "\n  Example: " +
          c.code("finta favorites remove AAPL stock") +
          "\n",
      );
      process.exit(1);
    }
    const data = await api.favorites.remove(token, symbol, assetType);
    process.stdout.write(
      c.success("✓") +
        " Removed " +
        c.brand(symbol) +
        " (" +
        assetType +
        ") from favorites.\n",
    );
    printJson(data);
    return;
  }

  process.stderr.write(
    c.error("✗") +
      " Unknown subcommand: " +
      c.code(subcommand) +
      "\n  Expected: " +
      c.code("list") +
      " | " +
      c.code("add") +
      " | " +
      c.code("remove") +
      "\n",
  );
  process.exit(1);
}

async function handleQuote(args: string[]) {
  const token = await requireApiKey();
  const [ticker, ...rest] = args;

  if (!ticker) {
    process.stderr.write(
      c.error("✗") +
        " Missing ticker.\n  Usage: " +
        c.code("finta quote <ticker> [--type <stock|crypto>]") +
        "\n  Example: " +
        c.code("finta quote AAPL") +
        "\n",
    );
    process.exit(1);
  }

  const flags = parseNamedArgs(rest);
  const assetType = parseAssetTypeFlag(flags.type);
  const data = (await api.quotes.get(token, ticker, assetType)) as QuoteApiResponse;
  printQuoteDetails(data);
}

async function handleSearch(args: string[]) {
  const token = await requireApiKey();
  const [query, type] = args;

  if (!query) {
    process.stderr.write(
      c.error("✗") +
        " Missing search query.\n  Usage: " +
        c.code("finta search <query> [type]") +
        "\n  Example: " +
        c.code("finta search apple") +
        "\n",
    );
    process.exit(1);
  }
  const data = await api.quotes.search(token, query, type);
  printJson(data);
}

/* ─────────────────────────── Command router ─────────────────────────── */

const commands: Record<string, (args: string[]) => Promise<void>> = {
  login: handleLogin,
  register: handleRegister,
  logout: handleLogout,
  keys: handleKeys,
  dashboard: handleDashboard,
  favorites: handleFavorites,
  quote: handleQuote,
  search: handleSearch,
  help: async (args) => printHelp(args[0]),
};

export function parseCliArgs(argv: string[]) {
  return parseArgs(argv);
}

export async function runHeadless(command: Command) {
  try {
    const handler = commands[command.name];
    if (!handler) {
      process.stderr.write(
        c.error("✗") +
          " Unknown command: " +
          c.code(command.name) +
          "\n\n",
      );
      printHelp();
      process.exit(1);
    }
    await handler(command.args);
  } catch (error) {
    printError(error);
  }
}
