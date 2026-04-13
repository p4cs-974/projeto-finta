import { createApplicationError } from "@finta/shared-kernel";

import type {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResult,
} from "../contracts/auth";
import type { IApiKeyRepository } from "../ports";

export interface ApiKeyServiceOptions {
  apiKeyRepository: IApiKeyRepository;
  generateRawKey: () => string | Promise<string>;
  hashKey: (rawKey: string) => string | Promise<string>;
  buildKeyName: (input: CreateApiKeyInput) => string;
  now?: () => Date;
}

const API_KEY_LIMIT = 5;

export class ApiKeyService {
  constructor(private readonly options: ApiKeyServiceOptions) {}

  async create(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const totalKeys = await this.options.apiKeyRepository.countByUserId(
      input.userId,
    );

    if (totalKeys >= API_KEY_LIMIT) {
      throw createApplicationError(
        409,
        "API_KEY_LIMIT_REACHED",
        "Limite de chaves de API atingido",
      );
    }

    const key = await this.options.generateRawKey();
    const keyHash = await this.options.hashKey(key);
    const createdAt = (this.options.now ?? (() => new Date()))().toISOString();
    const name = input.keyName ?? this.options.buildKeyName(input);
    const id = await this.options.apiKeyRepository.create({
      userId: input.userId,
      keyHash,
      name,
      createdAt,
    });

    return {
      id,
      name,
      key,
      createdAt,
    };
  }

  async listForUser(userId: number): Promise<ApiKey[]> {
    return this.options.apiKeyRepository.listByUserId(userId);
  }

  async revoke(input: { id: number; userId: number }): Promise<void> {
    const key = await this.options.apiKeyRepository.findById(input.id);

    if (!key || key.userId !== input.userId) {
      throw createApplicationError(
        404,
        "API_KEY_NOT_FOUND",
        "Chave de API não encontrada",
      );
    }

    await this.options.apiKeyRepository.delete(input.id);
  }
}
