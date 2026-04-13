import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import {
  api,
  clearConfig,
  isRevokedKeyError,
  saveConfig,
  type StoredConfig,
} from "./api/client";
import { AuthScreen } from "./screens/auth";

interface AppProps {
  initialConfig: StoredConfig | null;
}

export function App({ initialConfig }: AppProps) {
  const { colors } = useTheme();
  const [config, setConfig] = useState<StoredConfig | null>(initialConfig);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(initialConfig));

  useEffect(() => {
    if (!initialConfig) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;

    void api.auth
      .me(initialConfig.apiKey)
      .then(() => {
        if (!cancelled) {
          setCheckingSession(false);
        }
      })
      .catch(async (error) => {
        if (cancelled) {
          return;
        }

        if (isRevokedKeyError(error)) {
          await clearConfig();
          setConfig(null);
          setNotice("Your key was revoked. Please log in again.");
        }

        setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialConfig]);

  if (checkingSession) {
    return (
      <box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: colors.background,
        }}
      >
        <text fg={colors.mutedForeground}>Checking saved session...</text>
      </box>
    );
  }

  return (
    <box
      style={{
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: colors.background,
      }}
    >
      <AuthScreen
        config={config}
        notice={notice}
        onAuth={async (newConfig) => {
          await saveConfig(newConfig);
          setConfig(newConfig);
          setNotice(null);
        }}
        onLogout={async () => {
          if (!config) {
            return;
          }

          await api.auth.logout(config.apiKey, config.keyId);
          await clearConfig();
          setConfig(null);
        }}
      />
    </box>
  );
}
