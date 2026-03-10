import type { AppEnv } from "../../index";
import { ACCESS_TOKEN_TTL_SECONDS, signJwt } from "../../lib/jwt";
import { apiError, json, parseJsonRequest } from "../../lib/http";
import { verifyPassword } from "../../lib/password";
import { validateLoginUserInput } from "../../lib/validation";
import { findUserAuthByEmail } from "./user-repository";

function toIsoString(value: string): string {
	if (value.includes("T")) {
		return new Date(value).toISOString();
	}

	return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

export async function handleLogin(request: Request, env: AppEnv): Promise<Response> {
	const body = await parseJsonRequest<unknown>(request);
	const input = validateLoginUserInput(body);
	const user = await findUserAuthByEmail(env.DB, input.email);

	if (!user) {
		throw apiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
	}

	const passwordMatches = await verifyPassword(input.password, user.password_hash);

	if (!passwordMatches) {
		throw apiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
	}

	const issuedAt = Math.floor(Date.now() / 1000);
	const token = await signJwt(
		{
			sub: String(user.id),
			email: user.email,
			name: user.name,
			iat: issuedAt,
			exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
		},
		env.JWT_SECRET,
	);

	return json({
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
	});
}
