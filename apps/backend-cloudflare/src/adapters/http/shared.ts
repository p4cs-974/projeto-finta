import type { AssetType } from "@finta/shared-kernel";

import { apiError } from "../../lib/http";

export function parseRequestedAssetType(input: string | null): AssetType {
  if (input === null) {
    return "stock";
  }

  if (input === "crypto") {
    return "crypto";
  }

  throw apiError(422, "VALIDATION_ERROR", "Invalid asset type");
}

export function parseAuthenticatedUserId(input: string): number {
  const userId = Number.parseInt(input, 10);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Authenticated user id is invalid");
  }

  return userId;
}
