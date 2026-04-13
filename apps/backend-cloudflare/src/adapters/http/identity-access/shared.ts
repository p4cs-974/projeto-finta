import { ApiKeyService } from "@finta/identity-access";

import type { AppEnv } from "../../../app-env";
import { D1ApiKeyRepository } from "../../identity-access/d1-api-key-repository";
import { generateApiKey, hashApiKey } from "../../../lib/api-key";

function buildCliKeyName(deviceName?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const normalizedDeviceName = deviceName?.trim() || "Unknown device";

  return `CLI - ${normalizedDeviceName} - ${date}`;
}

export function createApiKeyService(env: AppEnv) {
  return new ApiKeyService({
    apiKeyRepository: new D1ApiKeyRepository(env.DB),
    generateRawKey: generateApiKey,
    hashKey: hashApiKey,
    buildKeyName: ({ keyName, deviceName }) =>
      keyName ?? buildCliKeyName(deviceName),
  });
}
