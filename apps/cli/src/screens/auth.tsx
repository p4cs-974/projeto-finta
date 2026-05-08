import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboard } from "@opentui/react";
import type { QuoteWithCacheMeta } from "@finta/price-query";
import type { AssetType } from "@finta/shared-kernel";

import {
  api,
  isRevokedKeyError,
  toStoredCliConfig,
  type StoredConfig,
} from "../api/client";
import { useExitHandler } from "../components/confirm-exit";
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
type AuthenticatedView = "home" | "quote-details" | "favorites";

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
    useState<AuthenticatedView>("home");
  const [quoteSymbol, setQuoteSymbol] = useState("");
  const [quoteType, setQuoteType] = useState<AssetType>("stock");
  const [quoteResult, setQuoteResult] = useState<QuoteWithCacheMeta | null>(null);
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
      setAuthenticatedView("home");
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
        err instanceof Error ? err.message : "Failed to load favorites",
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
          : "Failed to read favorited state",
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
          : "Failed to update favorite",
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
        err instanceof Error ? err.message : "Failed to remove favorite",
      );
    } finally {
      setFavoritesActionLoading(false);
    }
  }, [config, favoritesCursor, handleAuthFailure, refetchFavorites, sortedFavorites]);

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
      if (authenticatedView === "home") {
        if (key.name === "return" && !loading) {
          void handleLogout();
          return;
        }

        if (key.name.toLowerCase() === "d") {
          setAuthenticatedView("quote-details");
          setQuoteError(null);
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
          setAuthenticatedView("home");
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
          setAuthenticatedView("home");
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

  if (authenticated && config && authenticatedView === "home") {
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
        <box style={{ flexDirection: "column", alignItems: "center", gap: 0, marginBottom: 1 }}>
          <text fg={colors.sidebarPrimary} attributes={1}>
            ◆ FINTA
          </text>
          <text fg={colors.mutedForeground}>CLI API Key Authentication</text>
        </box>

        <box
          style={{
            width: 56,
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
            Logged in
          </text>
          <text fg={colors.foreground}>{config.user.name}</text>
          <text fg={colors.mutedForeground}>{config.user.email}</text>
          <text fg={colors.ring}>{config.keyName}</text>
          {notice && <text fg={colors.ring}>{notice}</text>}
          {error && <text fg={colors.destructive}>{`✗ ${error}`}</text>}
          <text fg={colors.sidebarPrimary}>Press D to view asset indicators</text>
          <text fg={colors.sidebarPrimary}>Press F to manage favorites</text>
          <text fg={loading ? colors.mutedForeground : colors.sidebarPrimary}>
            {loading ? "Revoking key..." : "Press Enter to logout"}
          </text>
        </box>

        <text fg={colors.ring}>
          {"D asset details  ·  F favorites  ·  Enter logout  ·  Ctrl+T toggle theme  ·  Ctrl+C exit  ·  Ctrl+Q quit"}
        </text>
        {overlay}
      </box>
    );
  }

  if (authenticated && config && authenticatedView === "quote-details") {
    const quote = quoteResult?.data;
    const symbol = quote ? ("ticker" in quote ? quote.ticker : quote.symbol) : null;
    const market = quote ? ("ticker" in quote ? quote.market : "CRYPTO") : null;

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
        <box style={{ flexDirection: "column", alignItems: "center", gap: 0, marginBottom: 1 }}>
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
            {`Type: ${quoteType} (press Tab to switch stock/crypto)`}
          </text>

          {quoteError && <text fg={colors.destructive}>{`✗ ${quoteError}`}</text>}

          <text fg={quoteLoading ? colors.mutedForeground : colors.sidebarPrimary}>
            {quoteLoading ? "Loading quote..." : "Press Enter to fetch asset details"}
          </text>

          {quoteResult && quote && symbol && market && (
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
              <text fg={colors.sidebarPrimary} attributes={1}>{`Asset: ${symbol}`}</text>
              <text fg={colors.foreground}>{`Name: ${quote.name}`}</text>
              <text fg={colors.mutedForeground}>{`Market: ${market}`}</text>
              <text fg={colors.mutedForeground}>{`Currency: ${quote.currency}`}</text>
              <text fg={colors.foreground}>{`Price: ${quote.price.toFixed(2)}`}</text>
              <text fg={quote.change >= 0 ? colors.sidebarPrimary : colors.destructive}>
                {`Change: ${formatSignedNumber(quote.change)} (${formatSignedNumber(
                  quote.changePercent,
                )}%)`}
              </text>
              <text fg={colors.mutedForeground}>{`Quoted at: ${quote.quotedAt}`}</text>
              <text fg={colors.mutedForeground}>{`Source: ${quoteResult.cache.source}`}</text>
              <text fg={colors.mutedForeground}>
                {`Stale: ${quoteResult.cache.stale ? "yes" : "no"}`}
              </text>
              <text fg={colors.mutedForeground}>{`Cache key: ${quoteResult.cache.key}`}</text>
              {quoteIsFavorited !== null && (
                <text
                  fg={
                    favoriteToggleLoading
                      ? colors.mutedForeground
                      : colors.sidebarPrimary
                  }
                >
                  {favoriteToggleLoading
                    ? "Updating favorite..."
                    : quoteIsFavorited
                    ? "Press F to unfavorite"
                    : "Press F to favorite"}
                </text>
              )}
              {favoriteToggleError && (
                <text fg={colors.destructive}>{`✗ ${favoriteToggleError}`}</text>
              )}
            </box>
          )}
        </box>

        <text fg={colors.ring}>
          {"Tab switch type  ·  Enter fetch  ·  F favorite  ·  Esc back  ·  Ctrl+T toggle theme  ·  Ctrl+C exit"}
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
          <text fg={colors.mutedForeground}>Favorites</text>
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
            <text fg={colors.mutedForeground}>Loading favorites...</text>
          )}
          {favoritesError && (
            <text fg={colors.destructive}>{`✗ ${favoritesError}`}</text>
          )}
          {!favoritesLoading && !favoritesError && sortedFavorites.length === 0 && (
            <text fg={colors.mutedForeground}>
              No favorites yet. Open the asset details screen (D) to add one.
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
                ? "Removing..."
                : `Remove ${sortedFavorites[favoritesCursor]!.symbol} (${
                    sortedFavorites[favoritesCursor]!.type
                  })? Press Y to confirm, N to cancel.`}
            </text>
          )}
        </box>

        <text fg={colors.ring}>
          {"↑↓ navigate  ·  D details  ·  X delete  ·  Esc back  ·  Ctrl+T toggle theme  ·  Ctrl+C exit"}
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
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, marginBottom: 1 }}>
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
            fg={mode === "login" ? colors.sidebarPrimary : colors.mutedForeground}
            attributes={mode === "login" ? 1 : 0}
          >
            Login
          </text>
          <text fg={colors.ring}>|</text>
          <text
            fg={mode === "register" ? colors.sidebarPrimary : colors.mutedForeground}
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
              borderColor: focused === "name" ? colors.sidebarPrimary : colors.input,
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
            borderColor: focused === "email" ? colors.sidebarPrimary : colors.input,
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
            borderColor: focused === "password" ? colors.sidebarPrimary : colors.input,
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
        {"↑↓ navigate  ·  esc unfocus  ·  Ctrl+T toggle theme  ·  tab mode  ·  Ctrl+Q quit  ·  Ctrl+C exit"}
      </text>
      {overlay}
    </box>
  );
}
