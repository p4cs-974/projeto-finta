import type { User } from "../db/schema";
import type { AccessTokenSigner } from "../lib/jwt";
import { signAccessToken } from "../lib/jwt";
import {
  createUser,
  findUserByEmail,
  isUniqueViolation,
} from "../repositories/users-repository";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type RegisterResult = {
  user: PublicUser;
  accessToken: string;
};

export class AuthValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "AuthValidationError";
  }
}

export class AuthConflictError extends Error {
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "AuthConflictError";
  }
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertValidName(name: string): void {
  if (name.length < 2 || name.length > 120) {
    throw new AuthValidationError("Nome deve ter entre 2 e 120 caracteres.");
  }
}

function assertValidEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthValidationError("Email invalido.");
  }
}

function assertValidPassword(password: string): void {
  if (password.length < 8) {
    throw new AuthValidationError("Senha deve ter no minimo 8 caracteres.");
  }
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function registerUser(
  input: CreateUserInput,
  jwt: AccessTokenSigner,
): Promise<RegisterResult> {
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);

  assertValidName(name);
  assertValidEmail(email);
  assertValidPassword(input.password);

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AuthConflictError("Email ja cadastrado.");
  }

  const passwordHash = await Bun.password.hash(input.password);

  try {
    const user = await createUser({
      name,
      email,
      passwordHash,
    });

    const accessToken = await signAccessToken(jwt, {
      sub: String(user.id),
      email: user.email,
    });

    return {
      user: toPublicUser(user),
      accessToken,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AuthConflictError("Email ja cadastrado.");
    }

    throw error;
  }
}
