import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";

import { describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);

describe("standalone distribution entrypoint", () => {
  it("prints the externally visible CLI version", async () => {
    const result = await execFile(
      "bun",
      ["run", "src/distribution/index.ts", "--version"],
      {
        cwd: new URL("../..", import.meta.url),
      },
    );

    expect(result.stdout.trim()).toBe("finta 0.1.0");
  });
});
