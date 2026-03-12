export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
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

export interface AuthSessionResult {
  user: PublicUser;
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
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
