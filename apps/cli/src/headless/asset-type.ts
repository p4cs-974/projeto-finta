export const ACCEPTED_ASSET_TYPES = ["stock", "crypto"] as const;

export type AssetTypeLiteral = (typeof ACCEPTED_ASSET_TYPES)[number];

export class InvalidAssetTypeError extends Error {
  readonly rawValue: string;
  readonly accepted: ReadonlyArray<AssetTypeLiteral>;

  constructor(rawValue: string) {
    super(
      `Tipo de ativo inválido: ${JSON.stringify(rawValue)}. Esperado um destes: ${ACCEPTED_ASSET_TYPES.join(", ")}.`,
    );
    this.rawValue = rawValue;
    this.accepted = ACCEPTED_ASSET_TYPES;
  }
}

export function parseAssetType(raw: string): AssetTypeLiteral {
  if ((ACCEPTED_ASSET_TYPES as ReadonlyArray<string>).includes(raw)) {
    return raw as AssetTypeLiteral;
  }

  throw new InvalidAssetTypeError(raw);
}

export function parseAssetTypeOrExit(raw: string): AssetTypeLiteral {
  try {
    return parseAssetType(raw);
  } catch (error) {
    if (error instanceof InvalidAssetTypeError) {
      process.stderr.write(
        `✗ Tipo de ativo inválido: ${error.rawValue}\n  Esperado: ${error.accepted.join(" | ")}\n`,
      );
      process.exit(1);
    }
    throw error;
  }
}
