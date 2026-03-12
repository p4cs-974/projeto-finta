import { createApplicationError } from "@finta/shared-kernel";
import type {
  IUserRepository,
  PublicUser,
  UserCredentials,
} from "@finta/identity-access";

function toIsoString(value: string): string {
  if (value.includes("T")) {
    return new Date(value).toISOString();
  }

  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /unique constraint failed: users\.email/i.test(error.message)
  );
}

export class D1UserRepository implements IUserRepository {
  constructor(private readonly db: D1Database) {}

  async existsByEmail(email: string) {
    const user = await this.db
      .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ id: number }>();

    return Boolean(user);
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    try {
      const result = await this.db
        .prepare(
          "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        )
        .bind(input.name, input.email, input.passwordHash)
        .run();
      const insertedId = result.meta.last_row_id;

      if (typeof insertedId !== "number") {
        throw new Error("D1 insert did not return last_row_id");
      }

      return insertedId;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw createApplicationError(
          409,
          "EMAIL_ALREADY_IN_USE",
          "Email already in use",
        );
      }

      throw error;
    }
  }

  async findPublicUserById(id: number): Promise<PublicUser | null> {
    const user = await this.db
      .prepare(
        "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1",
      )
      .bind(id)
      .first<{
        id: number;
        name: string;
        email: string;
        created_at: string;
      }>();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: toIsoString(user.created_at),
    };
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = await this.db
      .prepare(
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
      )
      .bind(email)
      .first<{
        id: number;
        name: string;
        email: string;
        password_hash: string;
        created_at: string;
      }>();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.password_hash,
      createdAt: toIsoString(user.created_at),
    };
  }
}
