import { z } from "zod";

import { apiError } from "./http";

const registerUserSchema = z
	.object({
		name: z.string().trim().min(2).max(100),
		email: z.string().trim().min(1).max(255).email().transform((value) => value.toLowerCase()),
		password: z.string().min(8).max(72),
	})
	.strict();

export type RegisterUserInput = z.output<typeof registerUserSchema>;

export function validateRegisterUserInput(input: unknown): RegisterUserInput {
	const parsed = registerUserSchema.safeParse(input);

	if (parsed.success) {
		return parsed.data;
	}

	throw apiError(422, "VALIDATION_ERROR", "Invalid request body", {
		fieldErrors: parsed.error.flatten().fieldErrors,
	});
}
