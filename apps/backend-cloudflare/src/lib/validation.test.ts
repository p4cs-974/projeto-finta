import { describe, expect, it } from "vitest";

import { HttpError } from "./http";
import { validateLoginUserInput, validateRegisterUserInput } from "./validation";

describe("register validation", () => {
	it("trims and normalizes unicode text while keeping the password intact", () => {
		const input = validateRegisterUserInput({
			name: "  Jose\u0301   da   Silva  ",
			email: " Pedro@Example.com ",
			password: "SenhaSegura123",
		});

		expect(input).toEqual({
			name: "José da Silva",
			email: "pedro@example.com",
			password: "SenhaSegura123",
		});
	});

	it("rejects control characters in user-facing fields", () => {
		expect(() =>
			validateRegisterUserInput({
				name: "Pedro\u0000Custodio",
				email: "pedro@example.com",
				password: "SenhaSegura123",
			}),
		).toThrow(HttpError);
	});

	it("throws a validation error with field details", () => {
		expect(() =>
			validateRegisterUserInput({
				name: "",
				email: "invalid",
				password: "123",
			}),
		).toThrow(HttpError);
	});
});

describe("login validation", () => {
	it("normalizes email casing and whitespace before lookup", () => {
		const input = validateLoginUserInput({
			email: " Pedro@Example.com ",
			password: "SenhaSegura123",
		});

		expect(input.email).toBe("pedro@example.com");
		expect(input.password).toBe("SenhaSegura123");
	});
});
