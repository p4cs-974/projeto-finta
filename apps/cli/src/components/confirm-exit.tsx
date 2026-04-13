import { useCallback, useEffect, useRef, useState } from "react";
import { useRenderer } from "@opentui/react";
import { useTheme } from "../theme-provider";

interface ConfirmExitProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmExit({ onConfirm, onCancel }: ConfirmExitProps) {
  const { colors } = useTheme();

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <box
        style={{
          flexDirection: "column",
          border: true,
          borderColor: colors.border,
          borderStyle: "rounded",
          backgroundColor: colors.card,
          padding: 2,
          gap: 1,
          alignItems: "center",
        }}
      >
        <text fg={colors.sidebarPrimary} attributes={1}>
          Exit Finta?
        </text>
        <text fg={colors.mutedForeground}>
          {"Press Return to confirm or Escape to cancel"}
        </text>
      </box>
    </box>
  );
}

interface ByeMessageProps {
  onFinished: () => void;
}

export function ByeMessage({ onFinished }: ByeMessageProps) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onFinished, 600);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <text fg={colors.sidebarPrimary} attributes={1}>
        Bye! 👋
      </text>
    </box>
  );
}

type ExitPhase = "idle" | "confirming" | "bye";

export function useExitHandler() {
  const renderer = useRenderer();
  const [phase, setPhase] = useState<ExitPhase>("idle");
  const phaseRef = useRef<ExitPhase>("idle");

  const setPhaseRef = useCallback((next: ExitPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const requestInterrupt = useCallback(() => {
    setPhaseRef("confirming");
  }, [setPhaseRef]);

  const cancelExit = useCallback(() => {
    setPhaseRef("idle");
  }, [setPhaseRef]);

  const confirmExit = useCallback(() => {
    setPhaseRef("bye");
  }, [setPhaseRef]);

  const exitNow = useCallback(() => {
    renderer.destroy();
    process.exit(0);
  }, [renderer]);

  const getPhase = useCallback(() => phaseRef.current, []);

  const overlay =
    phase === "bye" ? (
      <ByeMessage onFinished={exitNow} />
    ) : phase === "confirming" ? (
      <ConfirmExit onConfirm={confirmExit} onCancel={cancelExit} />
    ) : null;

  return { requestInterrupt, cancelExit, confirmExit, getPhase, overlay };
}
