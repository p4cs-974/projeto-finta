import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
	it("hashes and verifies passwords", async () => {
		const password = "SenhaSegura123";
		const hashedPassword = await hashPassword(password);

		expect(hashedPassword).toMatch(/^pbkdf2\$sha256\$310000\$/);
		await expect(verifyPassword(password, hashedPassword)).resolves.toBe(true);
		await expect(verifyPassword("senha-incorreta", hashedPassword)).resolves.toBe(false);
	});
});
