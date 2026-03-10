import { pbkdf2Sync, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
	it("hashes and verifies passwords", async () => {
		const password = "SenhaSegura123";
		const hashedPassword = await hashPassword(password);

		expect(hashedPassword).toMatch(/^pbkdf2\$sha256\$100000\$/);
		await expect(verifyPassword(password, hashedPassword)).resolves.toBe(true);
		await expect(verifyPassword("senha-incorreta", hashedPassword)).resolves.toBe(false);
	});

	it("verifies hashes using the iteration count stored in the hash", async () => {
		const password = "SenhaSegura123";
		const salt = randomBytes(16);
		const hash = pbkdf2Sync(password, salt, 90000, 32, "sha256");
		const encodedHash = [
			"pbkdf2",
			"sha256",
			"90000",
			salt.toString("base64url"),
			hash.toString("base64url"),
		].join("$");

		await expect(verifyPassword(password, encodedHash)).resolves.toBe(true);
		await expect(verifyPassword("senha-incorreta", encodedHash)).resolves.toBe(false);
	});
});
