import type { ApiKey, PublicUser, UserCredentials } from "../contracts/auth";

export interface IUserRepository {
  existsByEmail(email: string): Promise<boolean>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<number>;
  findPublicUserById(id: number): Promise<PublicUser | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface ITokenService {
  issueAccessToken(input: {
    sub: string;
    email: string;
    name: string;
  }): Promise<{
    token: string;
    expiresIn: number;
    tokenType: "Bearer";
  }>;
}

export interface IApiKeyRepository {
  create(input: {
    userId: number;
    keyHash: string;
    name: string;
    createdAt: string;
  }): Promise<number>;
  findByHash(keyHash: string): Promise<ApiKey | null>;
  listByUserId(userId: number): Promise<ApiKey[]>;
  findById(id: number): Promise<ApiKey | null>;
  delete(id: number): Promise<void>;
  countByUserId(userId: number): Promise<number>;
}
