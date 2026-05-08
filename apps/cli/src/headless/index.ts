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
import { formatDashboardText } from "./dashboard-format";
import { parseAssetTypeOrExit } from "./asset-type";

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
        " Sua chave de API salva é inválida ou foi revogada.\n  Execute " +
        c.code("finta login") +
        " para autenticar.\n",
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
  options?: string[];
  notes?: string[];
  examples: string[];
};

const commandHelps: Record<string, CommandHelp> = {
  login: {
    description: "Autentique-se com sua conta Finta.",
    usage: "finta login [--email <email>] [--password <password>]",
    examples: [
      "finta login",
      "finta login --email you@example.com --password secret",
    ],
  },
  register: {
    description: "Crie uma nova conta Finta.",
    usage:
      "finta register [--name <name>] [--email <email>] [--password <password>]",
    examples: [
      "finta register",
      'finta register --name "John Doe" --email you@example.com --password secret',
    ],
  },
  logout: {
    description: "Remove a autenticação local e exclui a chave de API salva.",
    usage: "finta logout",
    examples: ["finta logout"],
  },
  keys: {
    description: "Lista suas chaves de API ativas.",
    usage: "finta keys",
    examples: ["finta keys"],
  },
  dashboard: {
    description: "Mostra seu painel de ativos com as cotações mais recentes.",
    usage: "finta dashboard [--json]",
    options: ["--json  Exibe o resumo normalizado do painel em JSON."],
    examples: ["finta dashboard", "finta dashboard --json"],
  },
  favorites: {
    description: "Gerencia seus ativos favoritos.",
    usage:
      "finta favorites [list | add <symbol> <assetType> | remove <symbol> <assetType>]",
    notes: [
      "Se nenhum subcomando for informado, favorites usa list por padrão.",
      "assetType deve ser stock ou crypto.",
    ],
    examples: [
      "finta favorites",
      "finta favorites list",
      "finta favorites add AAPL stock",
      "finta favorites add BTC crypto",
      "finta favorites remove AAPL stock",
    ],
  },
  quote: {
    description: "Obtém a cotação em tempo real de um ativo.",
    usage: "finta quote <ticker> [--type <stock|crypto>]",
    options: [
      "--type <stock|crypto>  Diferencia tickers existentes em vários tipos de ativo.",
    ],
    examples: [
      "finta quote AAPL",
      "finta quote BTC --type crypto",
      "finta quote PETR4 --type stock",
    ],
  },
  search: {
    description: "Busca ativos por nome ou ticker.",
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
    c.dim("Rastreamento e Análise Financeira"),
  ]);
}

function printGlobalHelp() {
  const lines: string[] = [
    printHeader(),
    "",
    c.heading("Uso"),
    "  " + c.code("$ finta <command> [options]"),
    "",
    "  Execute sem argumentos para abrir a interface interativa.",
    "",
    c.heading("Opções Globais"),
    "  " +
      c.code("--no-ui, --headless".padEnd(22)) +
      "  Força o modo sem interface interativa",
    "  " +
      c.code("--json".padEnd(22)) +
      "  Exibe JSON para comandos compatíveis",
    "  " + c.code("--help, -h".padEnd(22)) + "  Mostra ajuda",
    "  " + c.code("--version, -v".padEnd(22)) + "  Mostra a versão",
    "",
    c.heading("Comandos"),
  ];

  const maxNameLen = Math.max(
    ...Object.keys(commandHelps).map((name) => name.length),
  );

  for (const [name, help] of Object.entries(commandHelps)) {
    lines.push(
      "  " + c.code(name.padEnd(maxNameLen)) + "  " + c.dim(help.description),
    );
  }

  lines.push(
    "",
    c.heading("Exemplos"),
    "  " + c.code("$ finta"),
    "  " + c.code("$ finta login"),
    "  " + c.code("$ finta quote AAPL"),
    "  " + c.code("$ finta search apple"),
    "  " + c.code("$ finta favorites add BTC crypto"),
    "",
    c.tip("Dica:") +
      " Use " +
      c.code("finta <command> --help") +
      " para detalhes de um comando específico.",
    "",
  );

  process.stdout.write(lines.join("\n"));
}

function printCommandHelp(commandName: string) {
  const help = commandHelps[commandName];
  if (!help) {
    process.stderr.write(
      c.error("✗") + " Comando desconhecido: " + c.code(commandName) + "\n",
    );
    printGlobalHelp();
    process.exit(1);
  }

  const lines: string[] = [
    printHeader(),
    "",
    c.heading("Comando"),
    "  " + c.brand(commandName),
    "",
    c.heading("Descrição"),
    "  " + help.description,
    "",
    c.heading("Uso"),
    "  " + c.code(help.usage),
    "",
  ];

  if (help.options?.length) {
    lines.push(c.heading("Opções"));
    for (const option of help.options) {
      lines.push("  " + option);
    }
    lines.push("");
  }

  if (help.notes?.length) {
    lines.push(c.heading("Observações"));
    for (const note of help.notes) {
      lines.push("  " + note);
    }
    lines.push("");
  }

  lines.push(c.heading("Exemplos"));

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
          " Valor ausente para a flag " +
          c.code(current) +
          "\n  Exemplo: " +
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

  return parseAssetTypeOrExit(rawType);
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
  const staleLabel = payload.cache.stale ? c.tip("sim") : c.success("não");

  const changeColor = quote.change >= 0 ? c.success : c.error;

  process.stdout.write(
    [
      c.heading("Ativo"),
      "  " + c.brand(symbol) + "  " + c.dim(quote.name),
      "",
      c.heading("Mercado"),
      "  " + market,
      "",
      c.heading("Preço"),
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
      c.heading("Informações da Cotação"),
      "  Cotado em:   " + quote.quotedAt,
      "  Fonte:       " + payload.cache.source,
      "  Desatualizado: " + staleLabel,
      "",
      c.dim("Chave do cache:      " + payload.cache.key),
      c.dim("Cache atualizado:  " + payload.cache.updatedAt),
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
        " Você não está logado.\n  Execute " +
        c.code("finta login") +
        " para autenticar.\n",
    );
    process.exit(1);
  }

  return config.apiKey;
}

/* ─────────────────────────── Handlers ─────────────────────────── */

async function handleLogin(args: string[]) {
  const flags = parseNamedArgs(args);
  const email = flags.email ?? (await promptFor("E-mail"));
  const password = flags.password ?? (await promptFor("Senha"));
  const result = await api.auth.login(email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  process.stdout.write(
    c.success("✓") +
      " Login feito como " +
      c.brand(result.data.user.name) +
      "\n  Chave: " +
      c.code(config.keyName) +
      "\n",
  );
}

async function handleRegister(args: string[]) {
  const flags = parseNamedArgs(args);
  const name = flags.name ?? (await promptFor("Nome"));
  const email = flags.email ?? (await promptFor("E-mail"));
  const password = flags.password ?? (await promptFor("Senha"));
  const result = await api.auth.register(name, email, password);
  const config = toStoredCliConfig(result.data);
  await saveConfig(config);
  process.stdout.write(
    c.success("✓") +
      " Cadastro feito e login feito como " +
      c.brand(result.data.user.name) +
      "\n  Chave: " +
      c.code(config.keyName) +
      "\n",
  );
}

async function handleLogout() {
  const config = await loadConfig();

  if (!config) {
    process.stdout.write(
      c.tip("!") +
        " Você não está autenticado.\n  Execute " +
        c.code("finta login") +
        " para fazer login.\n",
    );
    return;
  }

  await api.auth.logout(config.apiKey, config.keyId);
  await clearConfig();
  process.stdout.write(c.success("✓") + " Logout feito.\n");
}

async function handleKeys() {
  const token = await requireApiKey();
  const data = await api.auth.keys(token);
  printJson(data);
}

type RunHeadlessOptions = {
  json?: boolean;
};

let runOptions: RunHeadlessOptions = {};

async function handleDashboard() {
  const token = await requireApiKey();
  const data = await api.dashboard.get(token);
  if (runOptions.json) {
    printJson(data);
    return;
  }
  process.stdout.write(
    formatDashboardText(data as Parameters<typeof formatDashboardText>[0]),
  );
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
    const [symbol, rawAssetType] = args.slice(1);
    if (!symbol || !rawAssetType) {
      process.stderr.write(
        c.error("✗") +
          " Argumentos ausentes.\n  Uso: " +
          c.code("finta favorites add <symbol> <assetType>") +
          "\n  Exemplo: " +
          c.code("finta favorites add AAPL stock") +
          "\n",
      );
      process.exit(1);
    }
    const assetType = parseAssetTypeOrExit(rawAssetType);
    const data = await api.favorites.add(token, symbol, assetType);
    process.stdout.write(
      c.success("✓") +
        " Adicionado " +
        c.brand(symbol) +
        " (" +
        assetType +
        ") aos favoritos.\n",
    );
    printJson(data);
    return;
  }

  if (subcommand === "remove") {
    const [symbol, rawAssetType] = args.slice(1);
    if (!symbol || !rawAssetType) {
      process.stderr.write(
        c.error("✗") +
          " Argumentos ausentes.\n  Uso: " +
          c.code("finta favorites remove <symbol> <assetType>") +
          "\n  Exemplo: " +
          c.code("finta favorites remove AAPL stock") +
          "\n",
      );
      process.exit(1);
    }
    const assetType = parseAssetTypeOrExit(rawAssetType);
    const data = await api.favorites.remove(token, symbol, assetType);
    process.stdout.write(
      c.success("✓") +
        " Removido " +
        c.brand(symbol) +
        " (" +
        assetType +
        ") dos favoritos.\n",
    );
    printJson(data);
    return;
  }

  process.stderr.write(
    c.error("✗") +
      " Subcomando desconhecido: " +
      c.code(subcommand) +
      "\n  Esperado: " +
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
        " Ticker ausente.\n  Uso: " +
        c.code("finta quote <ticker> [--type <stock|crypto>]") +
        "\n  Exemplo: " +
        c.code("finta quote AAPL") +
        "\n",
    );
    process.exit(1);
  }

  const flags = parseNamedArgs(rest);
  const assetType = parseAssetTypeFlag(flags.type);
  const data = (await api.quotes.get(
    token,
    ticker,
    assetType,
  )) as QuoteApiResponse;
  printQuoteDetails(data);
}

async function handleSearch(args: string[]) {
  const token = await requireApiKey();
  const [query, type] = args;

  if (!query) {
    process.stderr.write(
      c.error("✗") +
        " Busca ausente.\n  Uso: " +
        c.code("finta search <query> [type]") +
        "\n  Exemplo: " +
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

export async function runHeadless(
  command: Command,
  options: RunHeadlessOptions = {},
) {
  runOptions = options;
  try {
    const handler = commands[command.name];
    if (!handler) {
      process.stderr.write(
        c.error("✗") + " Comando desconhecido: " + c.code(command.name) + "\n\n",
      );
      printHelp();
      process.exit(1);
    }
    await handler(command.args);
  } catch (error) {
    printError(error);
  }
}
