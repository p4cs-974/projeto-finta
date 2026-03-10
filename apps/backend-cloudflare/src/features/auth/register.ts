import type { AppEnv } from "../../index";
import { ACCESS_TOKEN_TTL_SECONDS, signJwt } from "../../lib/jwt";
import { apiError, json, parseJsonRequest } from "../../lib/http";
import { hashPassword } from "../../lib/password";
import { validateRegisterUserInput } from "../../lib/validation";
import {
	findPublicUserById,
	findUserByEmail,
	insertUser,
	isUniqueConstraintError,
} from "./user-repository";

function toIsoString(value: string): string {
	if (value.includes("T")) {
		return new Date(value).toISOString();
	}

	return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

export async function handleRegister(request: Request, env: AppEnv): Promise<Response> {
	const body = await parseJsonRequest<unknown>(request);
	const input = validateRegisterUserInput(body);

	const existingUser = await findUserByEmail(env.DB, input.email);

	if (existingUser) {
		throw apiError(409, "EMAIL_ALREADY_IN_USE", "Email already in use");
	}

	const passwordHash = await hashPassword(input.password);

	let userId: number;

	try {
		userId = await insertUser(env.DB, {
			name: input.name,
			email: input.email,
			passwordHash,
		});
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			throw apiError(409, "EMAIL_ALREADY_IN_USE", "Email already in use");
		}

		throw error;
	}

	const user = await findPublicUserById(env.DB, userId);

	if (!user) {
		throw new Error(`User ${userId} was inserted but could not be loaded`);
	}

	const issuedAt = Math.floor(Date.now() / 1000);
	const token = await signJwt(
		{
			sub: String(user.id),
			email: user.email,
			iat: issuedAt,
			exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
		},
		env.JWT_SECRET,
	);

	return json(
		{
			data: {
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					createdAt: toIsoString(user.created_at),
				},
				token,
				tokenType: "Bearer",
				expiresIn: ACCESS_TOKEN_TTL_SECONDS,
			},
		},
		{ status: 201 },
	);
}
