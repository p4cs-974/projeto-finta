import { describe, expect, it } from "vitest";

import { HttpError } from "./http";
import { validateRegisterUserInput } from "./validation";

describe("register validation", () => {
	it("trims name, normalizes email and keeps the password", () => {
		const input = validateRegisterUserInput({
			name: "  Pedro Custodio  ",
			email: " Pedro@Example.com ",
			password: "SenhaSegura123",
		});

		expect(input).toEqual({
			name: "Pedro Custodio",
			email: "pedro@example.com",
			password: "SenhaSegura123",
		});
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
