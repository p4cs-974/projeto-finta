import { useCallback, useMemo, useRef, useState } from "react";
import { useKeyboard } from "@opentui/react";

import {
  api,
  isRevokedKeyError,
  toStoredCliConfig,
  type StoredConfig,
} from "../api/client";
import { useExitHandler } from "../components/confirm-exit";
import { useTheme } from "../theme-provider";

interface AuthScreenProps {
  config: StoredConfig | null;
  notice?: string | null;
  onAuth: (config: StoredConfig) => Promise<void>;
  onLogout: () => Promise<void>;
}

type GuestMode = "login" | "register";
type AuthField = "name" | "email" | "password";

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

    if (authenticated) {
      if (key.name === "return" && !loading) {
        void handleLogout();
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

  if (authenticated && config) {
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
          <text fg={loading ? colors.mutedForeground : colors.sidebarPrimary}>
            {loading ? "Revoking key..." : "Press Enter to logout"}
          </text>
        </box>

        <text fg={colors.ring}>{"Ctrl+T toggle theme  ·  Enter logout  ·  Ctrl+C exit  ·  Ctrl+Q quit"}</text>
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
        {"↑↓ navigate  ·  esc unfocus  ·  Ctrl+T toggle theme  ·  tab mode  ·  Ctrl+Q quit  ·  Ctrl+C exit"}
      </text>
      {overlay}
    </box>
  );
}
