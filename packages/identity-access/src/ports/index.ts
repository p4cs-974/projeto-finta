import type { PublicUser, UserCredentials } from "../contracts/auth";

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
