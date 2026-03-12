export type AssetType = "stock" | "crypto";

export interface AuthenticatedPrincipal {
  userId: number;
  email: string;
  name: string;
}
