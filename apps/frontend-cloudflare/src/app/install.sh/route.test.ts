import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /install.sh", () => {
  it("serves the public Finta CLI bootstrap shell script", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/x-shellscript",
    );
    await expect(response.text()).resolves.toContain(
      "Finta CLI installer bootstrap",
    );
  });
});
