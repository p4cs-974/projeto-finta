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
import { sortFavorites } from "../favorites/sort";

interface CliFavoriteAsset {
  symbol: string;
  type: AssetType;
  label?: string;
  market?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  favoritedAt?: string;
}

interface AuthScreenProps {
  config: StoredConfig | null;
  notice?: string | null;
  onAuth: (config: StoredConfig) => Promise<void>;
  onLogout: () => Promise<void>;
}

type GuestMode = "login" | "register";
type AuthField = "name" | "email" | "password";
type AuthenticatedView = "dashboard" | "quote-details" | "favorites";

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
  const [quoteIsFavorited, setQuoteIsFavorited] = useState<boolean | null>(null);
  const [favoriteToggleLoading, setFavoriteToggleLoading] = useState(false);
  const [favoriteToggleError, setFavoriteToggleError] = useState<string | null>(
    null,
  );
  const [favoritesList, setFavoritesList] = useState<CliFavoriteAsset[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [favoritesCursor, setFavoritesCursor] = useState(0);
  const [favoritesConfirmRemove, setFavoritesConfirmRemove] = useState(false);
  const [favoritesActionLoading, setFavoritesActionLoading] = useState(false);

  const sortedFavorites = useMemo(
    () => sortFavorites(favoritesList),
    [favoritesList],
  );

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
      setQuoteIsFavorited(null);
      setFavoriteToggleError(null);
      setFavoritesList([]);
      setFavoritesError(null);
      setFavoritesCursor(0);
      setFavoritesConfirmRemove(false);
    }
  }, [authenticated]);

  const handleAuthFailure = useCallback(
    (err: unknown) => {
      if (isRevokedKeyError(err)) {
        void onLogout();
        return true;
      }
      return false;
    },
    [onLogout],
  );

  const refetchFavorites = useCallback(async () => {
    if (!config) {
      return;
    }
    setFavoritesError(null);
    setFavoritesLoading(true);
    try {
      const response = (await api.favorites.list(config.apiKey)) as {
        data: CliFavoriteAsset[];
      };
      setFavoritesList(response.data ?? []);
    } catch (err) {
      if (handleAuthFailure(err)) return;
      setFavoritesList([]);
      setFavoritesError(
        err instanceof Error ? err.message : "Falha ao carregar favoritos",
      );
    } finally {
      setFavoritesLoading(false);
    }
  }, [config, handleAuthFailure]);

  useEffect(() => {
    if (authenticated && authenticatedView === "favorites") {
      void refetchFavorites();
    }
  }, [authenticated, authenticatedView, refetchFavorites]);

  useEffect(() => {
    if (sortedFavorites.length === 0) {
      setFavoritesCursor(0);
      return;
    }
    setFavoritesCursor((prev) =>
      Math.min(Math.max(prev, 0), sortedFavorites.length - 1),
    );
  }, [sortedFavorites.length]);

  const refreshFavoritedFlag = useCallback(async () => {
    if (!config || !quoteResult) {
      setQuoteIsFavorited(null);
      return;
    }
    const quote = quoteResult.data;
    const symbol = "ticker" in quote ? quote.ticker : quote.symbol;
    setFavoriteToggleError(null);
    try {
      const response = (await api.favorites.list(config.apiKey)) as {
        data: CliFavoriteAsset[];
      };
      const found = (response.data ?? []).some(
        (item) =>
          item.symbol.toUpperCase() === symbol.toUpperCase() &&
          item.type === quoteType,
      );
      setQuoteIsFavorited(found);
    } catch (err) {
      if (handleAuthFailure(err)) return;
      setQuoteIsFavorited(null);
      setFavoriteToggleError(
        err instanceof Error
          ? err.message
          : "Falha ao ler estado de favorito",
      );
    }
  }, [config, handleAuthFailure, quoteResult, quoteType]);

  useEffect(() => {
    if (!quoteResult) {
      setQuoteIsFavorited(null);
      return;
    }
    void refreshFavoritedFlag();
  }, [quoteResult, refreshFavoritedFlag]);

  const handleToggleFavoriteForQuote = useCallback(async () => {
    if (!config || !quoteResult || quoteIsFavorited === null) {
      return;
    }
    const quote = quoteResult.data;
    const symbol = "ticker" in quote ? quote.ticker : quote.symbol;
    setFavoriteToggleError(null);
    setFavoriteToggleLoading(true);
    try {
      if (quoteIsFavorited) {
        await api.favorites.remove(config.apiKey, symbol, quoteType);
        setQuoteIsFavorited(false);
      } else {
        await api.favorites.add(config.apiKey, symbol, quoteType);
        setQuoteIsFavorited(true);
      }
    } catch (err) {
      if (handleAuthFailure(err)) return;
      setFavoriteToggleError(
        err instanceof Error
          ? err.message
          : "Falha ao atualizar favorito",
      );
    } finally {
      setFavoriteToggleLoading(false);
    }
  }, [config, handleAuthFailure, quoteResult, quoteIsFavorited, quoteType]);

  const handleConfirmRemoveFavorite = useCallback(async () => {
    if (!config) {
      return;
    }
    const target = sortedFavorites[favoritesCursor];
    if (!target) {
      setFavoritesConfirmRemove(false);
      return;
    }
    setFavoritesActionLoading(true);
    setFavoritesError(null);
    try {
      await api.favorites.remove(config.apiKey, target.symbol, target.type);
      setFavoritesConfirmRemove(false);
      await refetchFavorites();
    } catch (err) {
      if (handleAuthFailure(err)) return;
      setFavoritesError(
        err instanceof Error ? err.message : "Falha ao remover favorito",
      );
    } finally {
      setFavoritesActionLoading(false);
    }
  }, [
    config,
    favoritesCursor,
    handleAuthFailure,
    refetchFavorites,
    sortedFavorites,
  ]);

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
        err instanceof Error ? err.message : "Falha ao carregar painel",
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
            err instanceof Error ? err.message : "Falha ao carregar detalhes do ativo",
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
      setQuoteError("Digite primeiro o símbolo do ativo (exemplo: PETR4 ou BTC)");
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
        err instanceof Error ? err.message : "Falha ao carregar detalhes do ativo",
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

        if (key.name.toLowerCase() === "f") {
          setAuthenticatedView("favorites");
          setFavoritesError(null);
          setFavoritesConfirmRemove(false);
          return;
        }
      }

      if (authenticatedView === "quote-details") {
        if (key.name === "escape") {
          setAuthenticatedView("dashboard");
          setQuoteError(null);
          setFavoriteToggleError(null);
          return;
        }

        if (key.name === "tab") {
          setQuoteType((prev) => (prev === "stock" ? "crypto" : "stock"));
          setQuoteError(null);
          return;
        }

        if (
          key.name.toLowerCase() === "f" &&
          key.ctrl &&
          quoteResult &&
          quoteIsFavorited !== null &&
          !favoriteToggleLoading
        ) {
          void handleToggleFavoriteForQuote();
          return;
        }

        if (key.name === "return") {
          void handleLoadQuote();
          return;
        }
      }

      if (authenticatedView === "favorites") {
        if (favoritesConfirmRemove) {
          if (key.name.toLowerCase() === "y" && !favoritesActionLoading) {
            void handleConfirmRemoveFavorite();
            return;
          }
          if (key.name.toLowerCase() === "n" || key.name === "escape") {
            setFavoritesConfirmRemove(false);
            return;
          }
          return;
        }

        if (key.name === "escape") {
          setAuthenticatedView("dashboard");
          return;
        }

        if (key.name === "up") {
          setFavoritesCursor((prev) => Math.max(prev - 1, 0));
          return;
        }

        if (key.name === "down") {
          setFavoritesCursor((prev) =>
            Math.min(prev + 1, Math.max(sortedFavorites.length - 1, 0)),
          );
          return;
        }

        if (key.name.toLowerCase() === "x" && sortedFavorites.length > 0) {
          setFavoritesConfirmRemove(true);
          return;
        }

        if (key.name.toLowerCase() === "d") {
          setAuthenticatedView("quote-details");
          setQuoteError(null);
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
      setError(err instanceof Error ? err.message : "Falha na autenticação");
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
        setError("Sua chave já foi revogada. Faça login novamente.");
      } else {
        setError(err instanceof Error ? err.message : "Falha ao sair");
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
          <text fg={colors.mutedForeground}>Painel</text>
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
            <text fg={colors.mutedForeground}>Atualizando painel...</text>
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
          <text fg={colors.sidebarPrimary}>Pressione F para gerenciar favoritos</text>
          <text fg={loading ? colors.mutedForeground : colors.sidebarPrimary}>
            {loading
              ? "Revogando chave..."
              : "↑↓ selecionar · Enter detalhes da cotação · R atualizar · L sair"}
          </text>
        </box>

        <text fg={colors.ring}>
          {
            "↑↓ selecionar  ·  Enter detalhes  ·  F favoritos  ·  R atualizar  ·  L sair  ·  Ctrl+T tema  ·  Ctrl+C fechar"
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
          <text fg={colors.mutedForeground}>Detalhes do indicador do ativo</text>
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
            title="Símbolo do ativo"
            style={{
              border: true,
              borderColor: colors.sidebarPrimary,
              borderStyle: "rounded",
              height: 3,
              width: "100%",
            }}
          >
            <input
              placeholder="PETR4 ou BTC"
              value={quoteSymbol}
              onInput={(value) => setQuoteSymbol(value.toUpperCase())}
              onSubmit={() => void handleLoadQuote()}
              focused
              style={inputTheme}
            />
          </box>

          <text fg={colors.mutedForeground}>
            {`Tipo: ${quoteType} · transmissão: ${quoteStreamStatus} (pressione Tab para alternar stock/crypto)`}
          </text>

          {quoteError && (
            <text fg={colors.destructive}>{`✗ ${quoteError}`}</text>
          )}

          <text
            fg={quoteLoading ? colors.mutedForeground : colors.sidebarPrimary}
          >
            {quoteLoading
              ? "Carregando cotação..."
              : "Pressione Enter para buscar detalhes do ativo"}
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
              >{`Ativo: ${symbol}`}</text>
              <text fg={colors.foreground}>{`Nome: ${quote.name}`}</text>
              <text fg={colors.mutedForeground}>{`Mercado: ${market}`}</text>
              <text
                fg={colors.mutedForeground}
              >{`Moeda: ${quote.currency}`}</text>
              <text
                fg={colors.foreground}
              >{`Preço: ${formatMoney(quote.currency, quote.price)}`}</text>
              <text
                fg={
                  quote.change >= 0 ? colors.sidebarPrimary : colors.destructive
                }
              >
                {`Variação: ${formatSignedNumber(quote.change)} (${formatPercent(quote.changePercent)})`}
              </text>
              <text
                fg={colors.mutedForeground}
              >{`Cotado em: ${formatRelativeTime(quote.quotedAt)}`}</text>
              <text
                fg={colors.mutedForeground}
              >{`Fonte: ${liveQuoteResult.cache.source}`}</text>
              <text fg={colors.mutedForeground}>
                {`Desatualizado: ${liveQuoteResult.cache.stale ? "sim" : "não"}`}
              </text>
              <text
                fg={colors.mutedForeground}
              >{`Chave do cache: ${liveQuoteResult.cache.key}`}</text>
              {quoteIsFavorited !== null && (
                <text
                  fg={
                    favoriteToggleLoading
                      ? colors.mutedForeground
                      : colors.sidebarPrimary
                  }
                >
                  {favoriteToggleLoading
                    ? "Atualizando favorito..."
                    : quoteIsFavorited
                    ? "Pressione Ctrl+F para remover dos favoritos"
                    : "Pressione Ctrl+F para favoritar"}
                </text>
              )}
              {favoriteToggleError && (
                <text fg={colors.destructive}>{`✗ ${favoriteToggleError}`}</text>
              )}
            </box>
          )}
        </box>

        <text fg={colors.ring}>
          {"Tab alternar tipo  ·  Enter buscar  ·  Ctrl+F favorito  ·  Esc voltar  ·  Ctrl+T alternar tema  ·  Ctrl+C fechar"}
        </text>
        {overlay}
      </box>
    );
  }

  if (authenticated && config && authenticatedView === "favorites") {
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
          <text fg={colors.mutedForeground}>Favoritos</text>
        </box>

        <box
          style={{
            width: 60,
            flexDirection: "column",
            border: true,
            borderColor: colors.border,
            borderStyle: "rounded",
            backgroundColor: colors.card,
            padding: 2,
            gap: 1,
          }}
        >
          {favoritesLoading && (
            <text fg={colors.mutedForeground}>Carregando favoritos...</text>
          )}
          {favoritesError && (
            <text fg={colors.destructive}>{`✗ ${favoritesError}`}</text>
          )}
          {!favoritesLoading && !favoritesError && sortedFavorites.length === 0 && (
            <text fg={colors.mutedForeground}>
              Ainda não há favoritos. Abra a tela de detalhes do ativo (D) para adicionar um.
            </text>
          )}
          {!favoritesLoading &&
            sortedFavorites.length > 0 &&
            sortedFavorites.map((item, index) => {
              const isCursor = index === favoritesCursor;
              return (
                <text
                  key={`${item.symbol}:${item.type}`}
                  fg={isCursor ? colors.sidebarPrimary : colors.foreground}
                  attributes={isCursor ? 1 : 0}
                >
                  {`${isCursor ? "›" : " "} ${item.symbol} (${item.type})${
                    item.label ? ` — ${item.label}` : ""
                  }`}
                </text>
              );
            })}

          {favoritesConfirmRemove && sortedFavorites[favoritesCursor] && (
            <text fg={colors.destructive}>
              {favoritesActionLoading
                ? "Removendo..."
                : `Remover ${sortedFavorites[favoritesCursor]!.symbol} (${
                    sortedFavorites[favoritesCursor]!.type
                  })? Pressione Y para confirmar, N para cancelar.`}
            </text>
          )}
        </box>

        <text fg={colors.ring}>
          {"↑↓ navegar  ·  D detalhes  ·  X excluir  ·  Esc voltar  ·  Ctrl+T alternar tema  ·  Ctrl+C fechar"}
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
        <text fg={colors.mutedForeground}>Rastreamento e Análise Financeira</text>
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
            Entrar
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
            Cadastrar
          </text>
          <text fg={colors.ring}>{" [tab]"}</text>
        </box>

        {isRegister && (
          <box
            title="Nome"
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
              placeholder="Seu nome..."
              onInput={setName}
              onSubmit={() => focusDown()}
              focused={focused === "name"}
              style={inputTheme}
            />
          </box>
        )}

        <box
          title="E-mail"
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
          title="Senha"
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
            {loading ? "Enviando..." : "Pressione Enter para enviar"}
          </text>
        </box>
      </box>

      <text fg={colors.ring}>
        {
          "↑↓ navegar  ·  esc desfocar  ·  Ctrl+T alternar tema  ·  tab modo  ·  Ctrl+Q sair  ·  Ctrl+C fechar"
        }
      </text>
      {overlay}
    </box>
  );
}
