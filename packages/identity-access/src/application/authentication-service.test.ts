import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@finta/shared-kernel";

import type { PublicUser, UserCredentials } from "../contracts/auth";
import type { IPasswordHasher, ITokenService, IUserRepository } from "../ports";

import { AuthenticationService } from "./authentication-service";
import { RegistrationService } from "./registration-service";

function createPublicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 1,
    name: "Pedro Custodio",
    email: "pedro@example.com",
    createdAt: "2026-03-11T12:00:00.000Z",
    ...overrides,
  };
}

function createCredentials(
  overrides: Partial<UserCredentials> = {},
): UserCredentials {
  return {
    ...createPublicUser(),
    passwordHash: "hashed-password",
    ...overrides,
  };
}

describe("identity-access services", () => {
  it("registers a new user and returns a valid session", async () => {
    const userRepository: IUserRepository = {
      existsByEmail: vi.fn().mockResolvedValue(false),
      createUser: vi.fn().mockResolvedValue(1),
      findPublicUserById: vi.fn().mockResolvedValue(createPublicUser()),
      findCredentialsByEmail: vi.fn(),
    };
    const passwordHasher: IPasswordHasher = {
      hash: vi.fn().mockResolvedValue("hashed-password"),
      verify: vi.fn(),
    };
    const tokenService: ITokenService = {
      issueAccessToken: vi.fn().mockResolvedValue({
        token: "signed-token",
        tokenType: "Bearer",
        expiresIn: 3600,
      }),
    };
    const service = new RegistrationService({
      userRepository,
      passwordHasher,
      tokenService,
    });

    const session = await service.register({
      name: "Pedro Custodio",
      email: "pedro@example.com",
      password: "SenhaSegura123",
    });

    expect(session.user.email).toBe("pedro@example.com");
    expect(session.token).toBe("signed-token");
    expect(session.expiresIn).toBe(3600);
    expect(passwordHasher.hash).toHaveBeenCalledWith("SenhaSegura123");
  });

  it("returns a conflict error for duplicate emails on registration", async () => {
    const service = new RegistrationService({
      userRepository: {
        existsByEmail: vi.fn().mockResolvedValue(true),
        createUser: vi.fn(),
        findPublicUserById: vi.fn(),
        findCredentialsByEmail: vi.fn(),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn(),
      },
      tokenService: {
        issueAccessToken: vi.fn(),
      },
    });

    await expect(
      service.register({
        name: "Pedro Custodio",
        email: "pedro@example.com",
        password: "SenhaSegura123",
      }),
    ).rejects.toMatchObject<ApplicationError>({
      status: 409,
      code: "EMAIL_ALREADY_IN_USE",
    });
  });

  it("returns a valid session on successful login", async () => {
    const service = new AuthenticationService({
      userRepository: {
        existsByEmail: vi.fn(),
        createUser: vi.fn(),
        findPublicUserById: vi.fn(),
        findCredentialsByEmail: vi.fn().mockResolvedValue(createCredentials()),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(true),
      },
      tokenService: {
        issueAccessToken: vi.fn().mockResolvedValue({
          token: "signed-token",
          tokenType: "Bearer",
          expiresIn: 3600,
        }),
      },
    });

    const session = await service.login({
      email: "pedro@example.com",
      password: "SenhaSegura123",
    });

    expect(session.user.id).toBe(1);
    expect(session.tokenType).toBe("Bearer");
  });

  it("returns invalid credentials for wrong passwords", async () => {
    const service = new AuthenticationService({
      userRepository: {
        existsByEmail: vi.fn(),
        createUser: vi.fn(),
        findPublicUserById: vi.fn(),
        findCredentialsByEmail: vi.fn().mockResolvedValue(createCredentials()),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(false),
      },
      tokenService: {
        issueAccessToken: vi.fn(),
      },
    });

    await expect(
      service.login({
        email: "pedro@example.com",
        password: "SenhaErrada123",
      }),
    ).rejects.toMatchObject<ApplicationError>({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("passes through the token ttl exposed by the token service", async () => {
    const tokenService: ITokenService = {
      issueAccessToken: vi.fn().mockResolvedValue({
        token: "signed-token",
        tokenType: "Bearer",
        expiresIn: 7200,
      }),
    };
    const service = new AuthenticationService({
      userRepository: {
        existsByEmail: vi.fn(),
        createUser: vi.fn(),
        findPublicUserById: vi.fn(),
        findCredentialsByEmail: vi.fn().mockResolvedValue(createCredentials()),
      },
      passwordHasher: {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(true),
      },
      tokenService,
    });

    const session = await service.login({
      email: "pedro@example.com",
      password: "SenhaSegura123",
    });

    expect(session.expiresIn).toBe(7200);
    expect(tokenService.issueAccessToken).toHaveBeenCalledWith({
      sub: "1",
      email: "pedro@example.com",
      name: "Pedro Custodio",
    });
  });
});
