import { createApplicationError } from "@finta/shared-kernel";

import type {
  AuthSessionResult,
  IAuthenticationService,
  LoginInput,
} from "../contracts/auth";
import type { IPasswordHasher, ITokenService, IUserRepository } from "../ports";

export interface AuthenticationServiceOptions {
  userRepository: IUserRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
}

export class AuthenticationService implements IAuthenticationService {
  constructor(private readonly options: AuthenticationServiceOptions) {}

  async login(input: LoginInput): Promise<AuthSessionResult> {
    const user = await this.options.userRepository.findCredentialsByEmail(
      input.email,
    );

    if (!user) {
      throw createApplicationError(
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos",
      );
    }

    const passwordMatches = await this.options.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw createApplicationError(
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos",
      );
    }

    const token = await this.options.tokenService.issueAccessToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token: token.token,
      tokenType: token.tokenType,
      expiresIn: token.expiresIn,
    };
  }
}
