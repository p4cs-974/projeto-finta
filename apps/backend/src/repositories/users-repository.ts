import { eq } from "drizzle-orm";

import { db } from "../db";
import { NewUser, User, users } from "../db/schema";

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return user ?? null;
}

export async function createUser(input: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(input).returning();

  return user;
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && error.code === "23505";
}
