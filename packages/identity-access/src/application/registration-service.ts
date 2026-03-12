import {
  createApplicationError,
  isApplicationError,
} from "@finta/shared-kernel";

import type {
  AuthSessionResult,
  IRegistrationService,
  RegisterUserInput,
} from "../contracts/auth";
import type { IPasswordHasher, ITokenService, IUserRepository } from "../ports";

export interface RegistrationServiceOptions {
  userRepository: IUserRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
}

export class RegistrationService implements IRegistrationService {
  constructor(private readonly options: RegistrationServiceOptions) {}

  async register(input: RegisterUserInput): Promise<AuthSessionResult> {
    const emailAlreadyExists = await this.options.userRepository.existsByEmail(
      input.email,
    );

    if (emailAlreadyExists) {
      throw createApplicationError(
        409,
        "EMAIL_ALREADY_IN_USE",
        "Email already in use",
      );
    }

    const passwordHash = await this.options.passwordHasher.hash(input.password);

    let userId: number;

    try {
      userId = await this.options.userRepository.createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      if (isApplicationError(error) && error.code === "EMAIL_ALREADY_IN_USE") {
        throw error;
      }

      throw error;
    }

    const user = await this.options.userRepository.findPublicUserById(userId);

    if (!user) {
      throw createApplicationError(
        500,
        "INTERNAL_ERROR",
        "Created user could not be loaded",
      );
    }

    const token = await this.options.tokenService.issueAccessToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    return {
      user,
      token: token.token,
      tokenType: token.tokenType,
      expiresIn: token.expiresIn,
    };
  }
}
