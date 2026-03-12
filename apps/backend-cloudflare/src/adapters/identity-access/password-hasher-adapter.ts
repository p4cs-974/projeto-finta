import type { IPasswordHasher } from "@finta/identity-access";

import { hashPassword, verifyPassword } from "../../lib/password";

export class PasswordHasherAdapter implements IPasswordHasher {
  hash(password: string) {
    return hashPassword(password);
  }

  verify(password: string, passwordHash: string) {
    return verifyPassword(password, passwordHash);
  }
}
