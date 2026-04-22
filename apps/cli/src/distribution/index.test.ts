import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";

import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

const execFile = promisify(execFileCallback);

describe("standalone distribution entrypoint", () => {
  it("prints the externally visible CLI version", async () => {
    const result = await execFile(
      "bun",
      ["run", "src/distribution/index.tsx", "--version"],
      {
        cwd: new URL("../..", import.meta.url),
      },
    );

    // The version line now includes ANSI color codes
    expect(result.stdout.trim()).toContain(`finta`);
    expect(result.stdout.trim()).toContain(packageJson.version);
  });
});
