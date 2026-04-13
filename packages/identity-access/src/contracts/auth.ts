export type ClientType = "web" | "cli";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  clientType?: ClientType;
  deviceName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  clientType?: ClientType;
  deviceName?: string;
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserCredentials extends PublicUser {
  passwordHash: string;
}

export interface BearerAuthSessionResult {
  user: PublicUser;
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface ApiKey {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
}

export interface CreateApiKeyInput {
  userId: number;
  keyName?: string;
  deviceName?: string;
}

export interface CreateApiKeyResult {
  id: number;
  name: string;
  key: string;
  createdAt: string;
}

export interface ApiKeyAuthSessionResult {
  user: PublicUser;
  apiKey: CreateApiKeyResult;
  tokenType: "ApiKey";
}

export type AuthSessionResult =
  | BearerAuthSessionResult
  | ApiKeyAuthSessionResult;

export interface BearerAuthSessionResponseBody {
  data: BearerAuthSessionResult;
}

export interface ApiKeyAuthSessionResponseBody {
  data: ApiKeyAuthSessionResult;
}

export interface AuthSessionResponseBody {
  data: AuthSessionResult;
}

export interface IRegistrationService {
  register(input: RegisterUserInput): Promise<AuthSessionResult>;
}

export interface IAuthenticationService {
  login(input: LoginInput): Promise<AuthSessionResult>;
}
