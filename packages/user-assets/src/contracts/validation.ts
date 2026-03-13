import { createApplicationError } from "@finta/shared-kernel";
import { z } from "zod";

import type { TrackedAssetRef } from "./assets";

function normalizeDisplayText(value: string) {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F-\u009F]/u.test(value);
}

const trackedAssetSchema = z
  .object({
    symbol: z.string().trim().min(1),
    assetType: z.enum(["stock", "crypto"]),
    label: z
      .string()
      .transform(normalizeDisplayText)
      .refine((value) => value.length > 0 && !hasControlCharacters(value), {
        message: "O rótulo é inválido",
      }),
    market: z
      .union([z.string(), z.null()])
      .transform((value) =>
        typeof value === "string" ? normalizeDisplayText(value) : null,
      )
      .refine(
        (value) =>
          value === null || (value.length > 0 && !hasControlCharacters(value)),
        {
          message: "O mercado é inválido",
        },
      )
      .optional(),
    currency: z
      .union([z.string(), z.null()])
      .transform((value) =>
        typeof value === "string" ? normalizeDisplayText(value) : null,
      )
      .refine(
        (value) =>
          value === null || (value.length > 0 && !hasControlCharacters(value)),
        {
          message: "A moeda é inválida",
        },
      )
      .optional(),
    logoUrl: z.union([z.string().url(), z.null()]).optional(),
  })
  .strict();

export function parseTrackedAssetRefInput(input: unknown): TrackedAssetRef {
  const parsed = trackedAssetSchema.safeParse(input);

  if (parsed.success) {
    return {
      symbol: parsed.data.symbol.trim().toUpperCase(),
      assetType: parsed.data.assetType,
      label: parsed.data.label,
      market: parsed.data.market ?? null,
      currency: parsed.data.currency ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
    };
  }

  throw createApplicationError(
    422,
    "VALIDATION_ERROR",
    "Corpo da requisição inválido",
    {
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  );
}
