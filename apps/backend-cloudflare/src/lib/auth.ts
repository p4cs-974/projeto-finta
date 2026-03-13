import { apiError } from "./http";
import { type AuthTokenPayload, verifyJwt } from "./jwt";

export function extractBearerToken(request: Request): string {
	const authorization = request.headers.get("authorization");

	if (!authorization) {
		throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
	}

	const [scheme, token, ...rest] = authorization.trim().split(/\s+/u);

	if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
		throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
	}

	return token;
}

export async function requireAuth(request: Request, jwtSecret: string): Promise<AuthTokenPayload> {
	const token = extractBearerToken(request);
	const payload = await verifyJwt(token, jwtSecret);

	if (!payload) {
		throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
	}

	return payload;
}
