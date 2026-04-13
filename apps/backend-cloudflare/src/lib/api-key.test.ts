import { describe, expect, it } from "vitest";

import { generateApiKey, hashApiKey } from "./api-key";

describe("API key helpers", () => {
  it("generates a prefixed API key with the expected length", () => {
    const key = generateApiKey();

    expect(key.startsWith("finta_")).toBe(true);
    expect(key).toHaveLength(49);
  });

  it("generates unique keys across calls", () => {
    const first = generateApiKey();
    const second = generateApiKey();

    expect(first).not.toBe(second);
  });

  it("hashes API keys deterministically with SHA-256", () => {
    expect(hashApiKey("finta_test-key")).toBe(
      "9da32ec70bc8b1d753edfcfe51061bf7a9137cf05148d1acf4ed1de084d84f9e",
    );
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("finta_first")).not.toBe(hashApiKey("finta_second"));
  });
});
