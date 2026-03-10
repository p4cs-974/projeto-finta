import { z } from "zod";

import { apiError } from "./http";
import {
	hasControlCharacters,
	normalizeDisplayText,
	normalizeEmailText,
} from "./text";

const registerUserSchema = z
	.object({
		name: z
			.string()
			.transform(normalizeDisplayText)
			.refine((value) => !hasControlCharacters(value), {
				message: "Name contains invalid control characters",
			})
			.pipe(z.string().min(2).max(100)),
		email: z
			.string()
			.transform(normalizeEmailText)
			.refine((value) => !hasControlCharacters(value), {
				message: "Email contains invalid control characters",
			})
			.pipe(z.string().min(1).max(255).email()),
		password: z.string().min(8).max(72),
	})
	.strict();

const loginUserSchema = z
	.object({
		email: z
			.string()
			.transform(normalizeEmailText)
			.refine((value) => !hasControlCharacters(value), {
				message: "Email contains invalid control characters",
			})
			.pipe(z.string().min(1).max(255).email()),
		password: z.string().min(8).max(72),
	})
	.strict();

export type RegisterUserInput = z.output<typeof registerUserSchema>;
export type LoginUserInput = z.output<typeof loginUserSchema>;

export function validateRegisterUserInput(input: unknown): RegisterUserInput {
	const parsed = registerUserSchema.safeParse(input);

	if (parsed.success) {
		return parsed.data;
	}

	throw apiError(422, "VALIDATION_ERROR", "Invalid request body", {
		fieldErrors: parsed.error.flatten().fieldErrors,
	});
}

export function validateLoginUserInput(input: unknown): LoginUserInput {
	const parsed = loginUserSchema.safeParse(input);

	if (parsed.success) {
		return parsed.data;
	}

	throw apiError(422, "VALIDATION_ERROR", "Invalid request body", {
		fieldErrors: parsed.error.flatten().fieldErrors,
	});
}
