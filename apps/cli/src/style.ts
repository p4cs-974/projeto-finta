const esc = "\x1b[";

const ansiPattern = new RegExp(
  `${esc}\\[[0-9;]*m`,
  "g",
);

function stripAnsi(text: string): string {
  return text.replace(ansiPattern, "");
}

export const c = {
  /** Bold cyan — headers, emphasis */
  brand(text: string): string {
    return `${esc}1;36m${text}${esc}0m`;
  },

  /** Bold white — secondary headers */
  heading(text: string): string {
    return `${esc}1m${text}${esc}0m`;
  },

  /** Cyan — inline code, commands, file paths */
  code(text: string): string {
    return `${esc}36m${text}${esc}0m`;
  },

  /** Green — success, positive values */
  success(text: string): string {
    return `${esc}32m${text}${esc}0m`;
  },

  /** Yellow — warnings, tips, hints */
  tip(text: string): string {
    return `${esc}33m${text}${esc}0m`;
  },

  /** Red — errors, failures, negative values */
  error(text: string): string {
    return `${esc}31m${text}${esc}0m`;
  },

  /** Dim gray — secondary text, descriptions, borders */
  dim(text: string): string {
    return `${esc}2m${text}${esc}0m`;
  },
};

/** A small box-drawing helper for the header */
export function box(content: string[]): string {
  const width = Math.max(...content.map((line) => stripAnsi(line).length));
  const top = "┌" + "─".repeat(width + 2) + "┐";
  const bottom = "└" + "─".repeat(width + 2) + "┘";
  const lines = content.map((line) => {
    const visible = stripAnsi(line).length;
    const pad = width - visible;
    return `│ ${line}${" ".repeat(pad)} │`;
  });
  return [top, ...lines, bottom].join("\n");
}
