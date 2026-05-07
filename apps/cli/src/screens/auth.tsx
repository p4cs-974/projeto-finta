import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboard } from "@opentui/react";
import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";
import type { DashboardSnapshot } from "@finta/dashboard";

import {
  api,
  isRevokedKeyError,
  toStoredCliConfig,
  type StoredConfig,
} from "../api/client";
import { useExitHandler } from "../components/confirm-exit";
import {
  buildDashboardAssetRows,
  buildDashboardInitialQuotes,
  buildDashboardStreamConfigs,
  formatActivityText,
  formatMoney,
  formatPercent,
  formatRelativeTime,
  getDashboardAssetKey,
  getQuoteMarket,
  getQuoteSymbol,
  type DashboardAssetRow,
} from "../dashboard/presentation";
import {
  useCliQuoteStream,
  useCliQuoteStreams,
} from "../dashboard/quote-stream";
import { useTheme } from "../theme-provider";

interface AuthScreenProps {
  config: StoredConfig | null;
  notice?: string | null;
  onAuth: (config: StoredConfig) => Promise<void>;
  onLogout: () => Promise<void>;
}

type GuestMode = "login" | "register";
type AuthField = "name" | "email" | "password";
type AuthenticatedView = "dashboard" | "quote-details";

function formatSignedNumber(value: number, digits = 2) {
  const formatted = value.toFixed(digits);
  if (value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function AuthScreen({
  config,
  notice,
  onAuth,
  onLogout,
}: AuthScreenProps) {
  const { colors, toggle: toggleTheme } = useTheme();
  const { requestInterrupt, cancelExit, confirmExit, getPhase, overlay } =
    useExitHandler();
  const [mode, setMode] = useState<GuestMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [maskedPassword, setMaskedPassword] = useState("");
  const prevMaskedRef = useRef("");
  const [focused, setFocused] = useState<AuthField | null>("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticatedView, setAuthenticatedView] =
    useState<AuthenticatedView>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [selectedDashboardIndex, setSelectedDashboardIndex] = useState(0);
  const [quoteSymbol, setQuoteSymbol] = useState("");
  const [quoteType, setQuoteType] = useState<AssetType>("stock");
  const [quoteResult, setQuoteResult] = useState<QuoteWithCacheMeta | null>(
    null,
  );
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const authenticated = Boolean(config);
  const isRegister = mode === "register";
  const fields = useMemo<AuthField[]>(
    () => (isRegister ? ["name", "email", "password"] : ["email", "password"]),
    [isRegister],
  );
  const inputTheme = useMemo(
    () => ({
      textColor: colors.foreground,
      focusedTextColor: colors.foreground,
      backgroundColor: colors.card,
      focusedBackgroundColor: colors.card,
      placeholderColor: colors.mutedForeground,
    }),
    [colors.card, colors.foreground, colors.mutedForeground],
  );

  useEffect(() => {
    if (!authenticated) {
      setAuthenticatedView("dashboard");
      setDashboard(null);
      setQuoteResult(null);
      setQuoteError(null);
      setQuoteSymbol("");
      setQuoteType("stock");
    }
  }, [authenticated]);

  const focusUp = useCallback(() => {
    setFocused((prev) => {
      if (prev === null) return fields[fields.length - 1]!;
      const index = fields.indexOf(prev);
      return fields[(index - 1 + fields.length) % fields.length]!;
    });
  }, [fields]);

  const focusDown = useCallback(() => {
    setFocused((prev) => {
      if (prev === null) return fields[0]!;
      const index = fields.indexOf(prev);
      return fields[(index + 1) % fields.length]!;
    });
  }, [fields]);

  const toggleMode = useCallback(() => {
    if (authenticated) {
      return;
    }

    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null);
    setFocused(isRegister ? "email" : "name");
  }, [authenticated, isRegister]);

  const loadDashboard = useCallback(async () => {
    if (!config) {
      return;
    }

    setDashboardLoading(true);
    setDashboardError(null);
    try {
      setDashboard(
        (await api.dashboard.get(config.apiKey)) as DashboardSnapshot,
      );
    } catch (err) {
      setDashboardError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!authenticated || !config) {
      setDashboard(null);
      return;
    }

    void loadDashboard();
    const timer = setInterval(() => void loadDashboard(), 15_000);
    return () => clearInterval(timer);
  }, [authenticated, config, loadDashboard]);

  const dashboardRows = useMemo(
    () => (dashboard ? buildDashboardAssetRows(dashboard) : []),
    [dashboard],
  );
  const dashboardInitialQuotes = useMemo(
    () => (dashboard ? buildDashboardInitialQuotes(dashboard) : new Map()),
    [dashboard],
  );
  const dashboardStreams = useMemo(
    () => (dashboard ? buildDashboardStreamConfigs(dashboard) : []),
    [dashboard],
  );
  const { quotes: streamedDashboardQuotes, statuses: dashboardStreamStatuses } =
    useCliQuoteStreams({
      token: config?.apiKey ?? null,
      streams: dashboardStreams,
      initialQuotes: dashboardInitialQuotes,
      enabled: authenticatedView === "dashboard",
    });

  useEffect(() => {
    setSelectedDashboardIndex((index) =>
      Math.min(index, Math.max(0, dashboardRows.length - 1)),
    );
  }, [dashboardRows.length]);

  const openAsset = useCallback(
    (asset: Pick<DashboardAssetRow, "symbol" | "assetType">) => {
      if (!config) return;
      setQuoteSymbol(asset.symbol);
      setQuoteType(asset.assetType);
      setAuthenticatedView("quote-details");
      setQuoteError(null);
      setQuoteResult(null);
      setQuoteLoading(true);
      void api.quotes
        .get(config.apiKey, asset.symbol, asset.assetType)
        .then(setQuoteResult)
        .catch((err) => {
          setQuoteError(
            err instanceof Error ? err.message : "Failed to load asset details",
          );
        })
        .finally(() => setQuoteLoading(false));
    },
    [config],
  );

  const handleOpenSelectedAsset = useCallback(() => {
    const asset = dashboardRows[selectedDashboardIndex];
    if (!asset) return;
    openAsset(asset);
  }, [dashboardRows, openAsset, selectedDashboardIndex]);

  const { quote: streamedQuoteResult, status: quoteStreamStatus } =
    useCliQuoteStream({
      token: config?.apiKey ?? null,
      symbol: quoteSymbol,
      assetType: quoteType,
      initialQuote: quoteResult,
      enabled: authenticatedView === "quote-details",
    });

  const handleLoadQuote = useCallback(async () => {
    if (!config) {
      return;
    }

    const symbol = quoteSymbol.trim().toUpperCase();
    if (!symbol) {
      setQuoteError("Type an asset symbol first (example: PETR4 or BTC)");
      return;
    }

    setQuoteError(null);
    setQuoteLoading(true);

    try {
      const result = await api.quotes.get(config.apiKey, symbol, quoteType);
      setQuoteResult(result);
    } catch (err) {
      setQuoteResult(null);
      setQuoteError(
        err instanceof Error ? err.message : "Failed to load asset details",
      );
    } finally {
      setQuoteLoading(false);
    }
  }, [config, quoteSymbol, quoteType]);

  useKeyboard((key) => {
    const phase = getPhase();

    if (phase === "confirming") {
      if (key.name === "return") {
        confirmExit();
      }
      if (key.name === "escape") {
        cancelExit();
      }
      return;
    }

    if ((key.name === "q" && key.ctrl) || (key.name === "c" && key.ctrl)) {
      requestInterrupt();
      return;
    }

    if (key.name === "t" && key.ctrl && !key.meta) {
      toggleTheme();
      return;
    }

    if (authenticated && config) {
      if (authenticatedView === "dashboard") {
        if (key.name === "return") {
          handleOpenSelectedAsset();
          return;
        }

        if (key.name === "r") {
          void loadDashboard();
          return;
        }

        if (key.name === "l") {
          void handleLogout();
          return;
        }

        if (key.name === "down") {
          setSelectedDashboardIndex((index) =>
            Math.min(index + 1, Math.max(0, dashboardRows.length - 1)),
          );
          return;
        }

        if (key.name === "up") {
          setSelectedDashboardIndex((index) => Math.max(0, index - 1));
          return;
        }
      }

      if (authenticatedView === "quote-details") {
        if (key.name === "escape") {
          setAuthenticatedView("dashboard");
          setQuoteError(null);
          return;
        }

        if (key.name === "tab") {
          setQuoteType((prev) => (prev === "stock" ? "crypto" : "stock"));
          setQuoteError(null);
          return;
        }

        if (key.name === "return") {
          void handleLoadQuote();
          return;
        }
      }

      return;
    }

    if (key.name === "escape") {
      setFocused(null);
      return;
    }
    if (focused === null) {
      if (key.name === "up" || key.name === "down") {
        setFocused(fields[0]!);
      }
      return;
    }
    if (key.name === "tab") {
      toggleMode();
    }
    if (key.name === "up") {
      focusUp();
    }
    if (key.name === "down") {
      focusDown();
    }
  });

  const handleSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.auth.login(email, password)
          : await api.auth.register(name, email, password);

      await onAuth(toStoredCliConfig(result.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [mode, name, email, password, onAuth]);

  const handleLogout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await onLogout();
    } catch (err) {
      if (isRevokedKeyError(err)) {
        setError("Your key was already revoked. Log in again.");
      } else {
        setError(err instanceof Error ? err.message : "Logout failed");
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  if (authenticated && config && authenticatedView === "dashboard") {
    const recentRows = dashboardRows.filter((row) => row.section === "recent");
    const gainerRows = dashboardRows.filter((row) => row.section === "gainer");
    const loserRows = dashboardRows.filter((row) => row.section === "loser");
    const renderAssetRow = (row: DashboardAssetRow, index: number) => {
      const selected = selectedDashboardIndex === index;
      const streamKey = getDashboardAssetKey(row.symbol, row.assetType);
      const streamedQuote = streamedDashboardQuotes.get(streamKey) ?? row.quote;
      const status = dashboardStreamStatuses.get(streamKey);
      const quoteLabel = streamedQuote
        ? `${formatMoney(streamedQuote.data.currency, streamedQuote.data.price)}  ${formatPercent(streamedQuote.data.changePercent)}  ${status === "connected" ? "●" : status === "error" ? "×" : "○"}`
        : row.assetType;

      return (
        <text
          key={row.key}
          fg={selected ? colors.sidebarPrimary : colors.foreground}
          attributes={selected ? 1 : 0}
          onMouseDown={() => {
            setSelectedDashboardIndex(index);
            openAsset(row);
          }}
        >
          {`${selected ? "›" : " "} ${row.symbol.padEnd(8)} ${row.label.slice(0, 24).padEnd(24)} ${quoteLabel}`}
        </text>
      );
    };

    return (
      <box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          gap: 1,
        }}
      >
        <box
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            marginBottom: 1,
          }}
        >
          <text fg={colors.sidebarPrimary} attributes={1}>
            ◆ FINTA
          </text>
          <text fg={colors.mutedForeground}>Dashboard</text>
        </box>

        <box
          style={{
            width: 96,
            flexDirection: "column",
            border: true,
            borderColor: colors.border,
            borderStyle: "rounded",
            backgroundColor: colors.card,
            padding: 2,
            gap: 1,
          }}
        >
          <text fg={colors.sidebarPrimary} attributes={1}>
            {config.user.name}
          </text>
          <text fg={colors.mutedForeground}>{config.user.email}</text>
          {notice && <text fg={colors.ring}>{notice}</text>}
          {error && <text fg={colors.destructive}>{`✗ ${error}`}</text>}
          {dashboardError && (
            <text fg={colors.destructive}>{`✗ ${dashboardError}`}</text>
          )}
          {dashboardLoading && (
            <text fg={colors.mutedForeground}>Refreshing dashboard...</text>
          )}
          {dashboard && (
            <box style={{ flexDirection: "column", gap: 1 }}>
              <text
                fg={colors.foreground}
              >{`Favoritos: ${dashboard.stats.favoritesCount}  Buscas Hoje: ${dashboard.stats.searchesToday}  Visualizações Hoje: ${dashboard.stats.viewsToday}  Atualizado: ${formatRelativeTime(dashboard.generatedAt)}`}</text>

              <text fg={colors.sidebarPrimary} attributes={1}>
                Buscas Recentes
              </text>
              {recentRows.length === 0 ? (
                <text fg={colors.mutedForeground}>
                  Ainda não há buscas recentes.
                </text>
              ) : (
                recentRows.map((row, index) => renderAssetRow(row, index))
              )}

              <text fg={colors.sidebarPrimary} attributes={1}>
                Maiores Altas
              </text>
              {gainerRows.length === 0 ? (
                <text fg={colors.mutedForeground}>
                  Nenhuma alta fresca no cache.
                </text>
              ) : (
                gainerRows.map((row, offset) =>
                  renderAssetRow(row, recentRows.length + offset),
                )
              )}

              <text fg={colors.sidebarPrimary} attributes={1}>
                Maiores Baixas
              </text>
              {loserRows.length === 0 ? (
                <text fg={colors.mutedForeground}>
                  Nenhuma baixa fresca no cache.
                </text>
              ) : (
                loserRows.map((row, offset) =>
                  renderAssetRow(
                    row,
                    recentRows.length + gainerRows.length + offset,
                  ),
                )
              )}

              <text fg={colors.sidebarPrimary} attributes={1}>
                Atividade Recente
              </text>
              {dashboard.activityTimeline.length === 0 ? (
                <text fg={colors.mutedForeground}>
                  Nenhuma atividade recente registrada ainda.
                </text>
              ) : (
                dashboard.activityTimeline
                  .slice(0, 4)
                  .map((activity) => (
                    <text
                      key={`${activity.type}:${activity.createdAt}:${activity.symbol ?? activity.searchQuery ?? ""}`}
                      fg={colors.mutedForeground}
                    >{`${formatActivityText(activity)} · ${formatRelativeTime(activity.createdAt)}`}</text>
                  ))
              )}
            </box>
          )}
          <text fg={loading ? colors.mutedForeground : colors.sidebarPrimary}>
            {loading
              ? "Revoking key..."
              : "↑↓ select · Enter quote details · R refresh · L logout"}
          </text>
        </box>

        <text fg={colors.ring}>
          {
            "↑↓ select  ·  Enter details  ·  R refresh  ·  L logout  ·  Ctrl+T theme  ·  Ctrl+C exit"
          }
        </text>
        {overlay}
      </box>
    );
  }

  if (authenticated && config && authenticatedView === "quote-details") {
    const liveQuoteResult = streamedQuoteResult ?? quoteResult;
    const quote = liveQuoteResult?.data;
    const symbol = liveQuoteResult ? getQuoteSymbol(liveQuoteResult) : null;
    const market = liveQuoteResult ? getQuoteMarket(liveQuoteResult) : null;

    return (
      <box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          gap: 1,
        }}
      >
        <box
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            marginBottom: 1,
          }}
        >
          <text fg={colors.sidebarPrimary} attributes={1}>
            ◆ FINTA
          </text>
          <text fg={colors.mutedForeground}>Asset indicator details</text>
        </box>

        <box
          style={{
            width: 68,
            flexDirection: "column",
            border: true,
            borderColor: colors.border,
            borderStyle: "rounded",
            backgroundColor: colors.card,
            padding: 2,
            gap: 1,
          }}
        >
          <box
            title="Asset symbol"
            style={{
              border: true,
              borderColor: colors.sidebarPrimary,
              borderStyle: "rounded",
              height: 3,
              width: "100%",
            }}
          >
            <input
              placeholder="PETR4 or BTC"
              value={quoteSymbol}
              onInput={(value) => setQuoteSymbol(value.toUpperCase())}
              onSubmit={() => void handleLoadQuote()}
              focused
              style={inputTheme}
            />
          </box>

          <text fg={colors.mutedForeground}>
            {`Type: ${quoteType} · stream: ${quoteStreamStatus} (press Tab to switch stock/crypto)`}
          </text>

          {quoteError && (
            <text fg={colors.destructive}>{`✗ ${quoteError}`}</text>
          )}

          <text
            fg={quoteLoading ? colors.mutedForeground : colors.sidebarPrimary}
          >
            {quoteLoading
              ? "Loading quote..."
              : "Press Enter to fetch asset details"}
          </text>

          {liveQuoteResult && quote && symbol && market && (
            <box
              style={{
                flexDirection: "column",
                border: true,
                borderColor: colors.input,
                borderStyle: "rounded",
                padding: 1,
                gap: 0,
              }}
            >
              <text
                fg={colors.sidebarPrimary}
                attributes={1}
              >{`Asset: ${symbol}`}</text>
              <text fg={colors.foreground}>{`Name: ${quote.name}`}</text>
              <text fg={colors.mutedForeground}>{`Market: ${market}`}</text>
              <text
                fg={colors.mutedForeground}
              >{`Currency: ${quote.currency}`}</text>
              <text
                fg={colors.foreground}
              >{`Price: ${formatMoney(quote.currency, quote.price)}`}</text>
              <text
                fg={
                  quote.change >= 0 ? colors.sidebarPrimary : colors.destructive
                }
              >
                {`Change: ${formatSignedNumber(quote.change)} (${formatPercent(quote.changePercent)})`}
              </text>
              <text
                fg={colors.mutedForeground}
              >{`Quoted at: ${formatRelativeTime(quote.quotedAt)}`}</text>
              <text
                fg={colors.mutedForeground}
              >{`Source: ${liveQuoteResult.cache.source}`}</text>
              <text fg={colors.mutedForeground}>
                {`Stale: ${liveQuoteResult.cache.stale ? "yes" : "no"}`}
              </text>
              <text
                fg={colors.mutedForeground}
              >{`Cache key: ${liveQuoteResult.cache.key}`}</text>
            </box>
          )}
        </box>

        <text fg={colors.ring}>
          {
            "Tab switch type  ·  Enter fetch  ·  Esc back  ·  Ctrl+T toggle theme  ·  Ctrl+C exit"
          }
        </text>
        {overlay}
      </box>
    );
  }

  return (
    <box
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        gap: 1,
      }}
    >
      <box
        style={{
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          marginBottom: 1,
        }}
      >
        <text fg={colors.sidebarPrimary} attributes={1}>
          ◆ FINTA
        </text>
        <text fg={colors.mutedForeground}>FINancial Tracking & Analysis</text>
      </box>

      <box
        style={{
          width: 50,
          flexDirection: "column",
          border: true,
          borderColor: colors.border,
          borderStyle: "rounded",
          backgroundColor: colors.card,
          padding: 2,
          gap: 1,
        }}
      >
        <box style={{ flexDirection: "row", justifyContent: "center", gap: 2 }}>
          <text
            fg={
              mode === "login" ? colors.sidebarPrimary : colors.mutedForeground
            }
            attributes={mode === "login" ? 1 : 0}
          >
            Login
          </text>
          <text fg={colors.ring}>|</text>
          <text
            fg={
              mode === "register"
                ? colors.sidebarPrimary
                : colors.mutedForeground
            }
            attributes={mode === "register" ? 1 : 0}
          >
            Register
          </text>
          <text fg={colors.ring}>{" [tab]"}</text>
        </box>

        {isRegister && (
          <box
            title="Name"
            style={{
              border: true,
              borderColor:
                focused === "name" ? colors.sidebarPrimary : colors.input,
              borderStyle: "rounded",
              height: 3,
              width: "100%",
            }}
          >
            <input
              placeholder="Your name..."
              onInput={setName}
              onSubmit={() => focusDown()}
              focused={focused === "name"}
              style={inputTheme}
            />
          </box>
        )}

        <box
          title="Email"
          style={{
            border: true,
            borderColor:
              focused === "email" ? colors.sidebarPrimary : colors.input,
            borderStyle: "rounded",
            height: 3,
            width: "100%",
          }}
        >
          <input
            placeholder="you@example.com"
            onInput={setEmail}
            onSubmit={() => focusDown()}
            focused={focused === "email"}
            style={inputTheme}
          />
        </box>

        <box
          title="Password"
          style={{
            border: true,
            borderColor:
              focused === "password" ? colors.sidebarPrimary : colors.input,
            borderStyle: "rounded",
            height: 3,
            width: "100%",
          }}
        >
          <input
            placeholder="••••••••"
            value={maskedPassword}
            onInput={(masked) => {
              const prev = prevMaskedRef.current;
              if (masked.length > prev.length) {
                const added = masked.slice(prev.length);
                setPassword((p) => p + added);
              } else if (masked.length < prev.length) {
                setPassword((p) => p.slice(0, masked.length));
              }
              const next = "•".repeat(masked.length);
              prevMaskedRef.current = next;
              setMaskedPassword(next);
            }}
            onSubmit={handleSubmit}
            focused={focused === "password"}
            style={inputTheme}
          />
        </box>

        {notice && <text fg={colors.ring}>{notice}</text>}
        {error && <text fg={colors.destructive}>{`✗ ${error}`}</text>}

        <box
          style={{
            height: 1,
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          <text fg={loading ? colors.mutedForeground : colors.sidebarPrimary}>
            {loading ? "Submitting..." : "Press Enter to submit"}
          </text>
        </box>
      </box>

      <text fg={colors.ring}>
        {
          "↑↓ navigate  ·  esc unfocus  ·  Ctrl+T toggle theme  ·  tab mode  ·  Ctrl+Q quit  ·  Ctrl+C exit"
        }
      </text>
      {overlay}
    </box>
  );
}
