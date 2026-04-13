import { hostname } from "node:os";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

import type { ApiErrorBody } from "@finta/shared-kernel";

const DEFAULT_API_URL = "http://localhost:8787";
const DEFAULT_CLI_RATE_LIMIT_MAX_REQUESTS = 30;
const DEFAULT_CLI_RATE_LIMIT_WINDOW_MS = 60_000;

type CliRateLimitState = {
  timestamps: number[];
};

export class FintaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: ApiErrorBody | null,
  ) {
    super(message);
  }
}

export class CliRateLimitError extends Error {
  constructor(
    readonly retryAfterMs: number,
    readonly maxRequests: number,
    readonly windowMs: number,
  ) {
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const windowSeconds = Math.ceil(windowMs / 1000);

    super(
      `CLI rate limit exceeded: ${maxRequests} requests per ${windowSeconds}s. Try again in ${retryAfterSeconds}s.`,
    );
  }
}

export interface StoredConfig {
  apiKey: string;
  apiUrl: string;
  user: { id: number; name: string; email: string };
  keyName: string;
  keyId: number;
}

export interface CliAuthSession {
  user: { id: number; name: string; email: string };
  apiKey: { id: number; key: string; name: string };
  tokenType: "ApiKey";
}

function getConfigDir(): string {
  if (process.env.FINTA_CONFIG_DIR) {
    return process.env.FINTA_CONFIG_DIR;
  }

  const home = process.env.HOME ?? process.env.USERPROFILE ?? "~";
  return `${home}/.finta`;
}

function getConfigPath(): string {
  return `${getConfigDir()}/config.json`;
}

function getRateLimitPath(): string {
  return `${getConfigDir()}/rate-limit.json`;
}

export function getApiUrl(): string {
  return process.env.FINTA_API_URL ?? DEFAULT_API_URL;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCliRateLimitMaxRequests(): number {
  return readPositiveInt(
    process.env.FINTA_CLI_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_CLI_RATE_LIMIT_MAX_REQUESTS,
  );
}

function getCliRateLimitWindowMs(): number {
  return readPositiveInt(
    process.env.FINTA_CLI_RATE_LIMIT_WINDOW_MS,
    DEFAULT_CLI_RATE_LIMIT_WINDOW_MS,
  );
}

export function getDeviceName(): string {
  return hostname();
}

export async function loadConfig(): Promise<StoredConfig | null> {
  try {
    const raw = await readFile(getConfigPath(), "utf-8");
    return JSON.parse(raw) as StoredConfig;
  } catch {
    return null;
  }
}

async function loadRateLimitState(): Promise<CliRateLimitState> {
  try {
    const raw = await readFile(getRateLimitPath(), "utf-8");
    const parsed = JSON.parse(raw) as CliRateLimitState;

    if (
      Array.isArray(parsed.timestamps) &&
      parsed.timestamps.every((value) => typeof value === "number")
    ) {
      return parsed;
    }
  } catch {}

  return { timestamps: [] };
}

async function saveRateLimitState(state: CliRateLimitState): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getRateLimitPath(), JSON.stringify(state, null, 2), "utf-8");
}

async function reserveCliRequestSlot(now = Date.now()): Promise<void> {
  const maxRequests = getCliRateLimitMaxRequests();
  const windowMs = getCliRateLimitWindowMs();

  const state = await loadRateLimitState();
  const activeTimestamps = state.timestamps.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (activeTimestamps.length >= maxRequests) {
    const oldestActiveTimestamp = activeTimestamps[0]!;
    const retryAfterMs = Math.max(1, windowMs - (now - oldestActiveTimestamp));

    throw new CliRateLimitError(retryAfterMs, maxRequests, windowMs);
  }

  activeTimestamps.push(now);
  await saveRateLimitState({ timestamps: activeTimestamps });
}

export async function saveConfig(config: StoredConfig): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}

export async function clearConfig(): Promise<void> {
  try {
    await rm(getConfigPath());
  } catch {}
}

function toStoredConfig(session: CliAuthSession): StoredConfig {
  return {
    apiKey: session.apiKey.key,
    apiUrl: getApiUrl(),
    user: session.user,
    keyName: session.apiKey.name,
    keyId: session.apiKey.id,
  };
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const { method = "GET", body, token, params } = options;
  await reserveCliRequestSlot();

  let url = `${getApiUrl()}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorBody | null;
    throw new FintaApiError(
      errorPayload?.error?.message ??
        `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.error?.code,
      errorPayload,
    );
  }

  return payload as T;
}

function withCliAuthBody<T extends Record<string, string>>(
  body: T,
): T & { client_type: "cli"; device_name: string } {
  return {
    ...body,
    client_type: "cli",
    device_name: getDeviceName(),
  };
}

export function isRevokedKeyError(error: unknown): boolean {
  return (
    error instanceof FintaApiError &&
    error.status === 401 &&
    error.code === "INVALID_TOKEN"
  );
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ data: CliAuthSession }>("/auth/login", {
        method: "POST",
        body: withCliAuthBody({ email, password }),
      }),

    register: (name: string, email: string, password: string) =>
      request<{ data: CliAuthSession }>("/auth/register", {
        method: "POST",
        body: withCliAuthBody({ name, email, password }),
      }),

    me: (token: string) =>
      request<{
        data: {
          user: { id: number; name: string; email: string };
          apiKey?: { id: number; name: string };
        };
      }>("/auth/me", { token }),

    keys: (token: string) =>
      request<{
        data: Array<{ id: number; name: string; createdAt: string }>;
      }>("/auth/api-keys", { token }),

    logout: (token: string, keyId: number) =>
      request<void>(`/auth/api-keys/${keyId}`, {
        method: "DELETE",
        token,
      }),
  },

  dashboard: {
    get: (token: string) => request("/users/me/dashboard", { token }),
  },

  favorites: {
    list: (token: string) => request("/users/me/favorites", { token }),

    add: (token: string, symbol: string, assetType: string) =>
      request("/users/me/favorites", {
        method: "POST",
        token,
        body: { symbol, assetType },
      }),

    remove: (token: string, symbol: string, assetType: string) =>
      request("/users/me/favorites", {
        method: "DELETE",
        token,
        body: { symbol, assetType },
      }),
  },

  quotes: {
    search: (token: string, query: string, type?: string) =>
      request("/ativos/cache-search", {
        token,
        params: { q: query, ...(type ? { type } : {}) },
      }),

    get: (token: string, ticker: string) => request(`/ativos/${ticker}`, { token }),

    getCached: (token: string, ticker: string) =>
      request(`/ativos/${ticker}/cache`, { token }),
  },

  recentAssets: {
    list: (token: string) => request("/users/me/recent-assets", { token }),

    record: (token: string, symbol: string, assetType: string) =>
      request("/users/me/recent-assets", {
        method: "POST",
        token,
        body: { symbol, assetType },
      }),
  },
};

export function toStoredCliConfig(session: CliAuthSession): StoredConfig {
  return toStoredConfig(session);
}
