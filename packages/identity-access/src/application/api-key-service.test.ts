import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@finta/shared-kernel";

import type { ApiKey } from "../contracts/auth";
import type { IApiKeyRepository } from "../ports";

import { ApiKeyService } from "./api-key-service";

function createApiKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 7,
    userId: 1,
    name: "CLI - test-host - 2026-04-12",
    createdAt: "2026-04-12T10:00:00.000Z",
    ...overrides,
  };
}

function createRepository(): IApiKeyRepository {
  return {
    create: vi.fn().mockResolvedValue(7),
    findByHash: vi.fn(),
    listByUserId: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    countByUserId: vi.fn().mockResolvedValue(0),
  };
}

describe("ApiKeyService", () => {
  it("creates a key and returns the raw key with metadata", async () => {
    const apiKeyRepository = createRepository();
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn().mockResolvedValue("finta_raw-key"),
      hashKey: vi.fn().mockResolvedValue("hashed-key"),
      buildKeyName: vi.fn().mockReturnValue("CLI - host - 2026-04-12"),
      now: () => new Date("2026-04-12T10:00:00.000Z"),
    });

    const result = await service.create({ userId: 1 });

    expect(result).toEqual({
      id: 7,
      name: "CLI - host - 2026-04-12",
      key: "finta_raw-key",
      createdAt: "2026-04-12T10:00:00.000Z",
    });
  });

  it("hashes the raw key before storing it", async () => {
    const apiKeyRepository = createRepository();
    const hashKey = vi.fn().mockResolvedValue("hashed-key");
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn().mockResolvedValue("finta_raw-key"),
      hashKey,
      buildKeyName: vi.fn().mockReturnValue("CLI - host - 2026-04-12"),
      now: () => new Date("2026-04-12T10:00:00.000Z"),
    });

    await service.create({ userId: 1 });

    expect(hashKey).toHaveBeenCalledWith("finta_raw-key");
    expect(apiKeyRepository.create).toHaveBeenCalledWith({
      userId: 1,
      keyHash: "hashed-key",
      name: "CLI - host - 2026-04-12",
      createdAt: "2026-04-12T10:00:00.000Z",
    });
  });

  it("rejects creation when the user has reached the 5-key limit", async () => {
    const apiKeyRepository = createRepository();
    apiKeyRepository.countByUserId = vi.fn().mockResolvedValue(5);
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn(),
      hashKey: vi.fn(),
      buildKeyName: vi.fn().mockReturnValue("CLI - host - 2026-04-12"),
    });

    await expect(service.create({ userId: 1 })).rejects.toMatchObject<
      ApplicationError
    >({
      status: 409,
      code: "API_KEY_LIMIT_REACHED",
    });
  });

  it("lists keys for a user without exposing raw key values", async () => {
    const apiKeyRepository = createRepository();
    apiKeyRepository.listByUserId = vi
      .fn()
      .mockResolvedValue([createApiKey(), createApiKey({ id: 8 })]);
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn(),
      hashKey: vi.fn(),
      buildKeyName: vi.fn().mockReturnValue("unused"),
    });

    const keys = await service.listForUser(1);

    expect(keys).toEqual([
      createApiKey(),
      createApiKey({ id: 8 }),
    ]);
  });

  it("revokes a key by id", async () => {
    const apiKeyRepository = createRepository();
    apiKeyRepository.findById = vi.fn().mockResolvedValue(createApiKey());
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn(),
      hashKey: vi.fn(),
      buildKeyName: vi.fn().mockReturnValue("unused"),
    });

    await service.revoke({ id: 7, userId: 1 });

    expect(apiKeyRepository.delete).toHaveBeenCalledWith(7);
  });

  it("fails when revoking another user's key", async () => {
    const apiKeyRepository = createRepository();
    apiKeyRepository.findById = vi
      .fn()
      .mockResolvedValue(createApiKey({ userId: 2 }));
    const service = new ApiKeyService({
      apiKeyRepository,
      generateRawKey: vi.fn(),
      hashKey: vi.fn(),
      buildKeyName: vi.fn().mockReturnValue("unused"),
    });

    await expect(service.revoke({ id: 7, userId: 1 })).rejects.toMatchObject<
      ApplicationError
    >({
      status: 404,
      code: "API_KEY_NOT_FOUND",
    });
  });
});
