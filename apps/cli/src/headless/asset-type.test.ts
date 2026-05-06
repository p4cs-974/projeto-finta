import { afterEach, describe, expect, it, vi } from "vitest";

import {
  InvalidAssetTypeError,
  parseAssetType,
  parseAssetTypeOrExit,
} from "./asset-type";

describe("parseAssetType", () => {
  it("returns 'stock' for the literal 'stock'", () => {
    expect(parseAssetType("stock")).toBe("stock");
  });

  it("returns 'crypto' for the literal 'crypto'", () => {
    expect(parseAssetType("crypto")).toBe("crypto");
  });

  it("throws InvalidAssetTypeError naming the offending value for unknown input", () => {
    try {
      parseAssetType("bond");
      throw new Error("expected parseAssetType to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAssetTypeError);
      expect((error as InvalidAssetTypeError).rawValue).toBe("bond");
      expect((error as InvalidAssetTypeError).accepted).toEqual([
        "stock",
        "crypto",
      ]);
    }
  });

  it("rejects empty string", () => {
    expect(() => parseAssetType("")).toThrow(InvalidAssetTypeError);
  });

  it("is case-sensitive (uppercase 'STOCK' is rejected)", () => {
    expect(() => parseAssetType("STOCK")).toThrow(InvalidAssetTypeError);
  });
});

describe("parseAssetTypeOrExit", () => {
  const stderrWrites: string[] = [];
  const stderrSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation((chunk: unknown) => {
      stderrWrites.push(String(chunk));
      return true;
    });
  const exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

  afterEach(() => {
    stderrWrites.length = 0;
    stderrSpy.mockClear();
    exitSpy.mockClear();
  });

  it("returns the narrow union for valid input", () => {
    expect(parseAssetTypeOrExit("crypto")).toBe("crypto");
    expect(stderrSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("writes the offending value and accepted set to stderr, then exits 1", () => {
    expect(() => parseAssetTypeOrExit("foobar")).toThrow("process.exit(1)");

    const combined = stderrWrites.join("");
    expect(combined).toContain("foobar");
    expect(combined).toContain("stock");
    expect(combined).toContain("crypto");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
