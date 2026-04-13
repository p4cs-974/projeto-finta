import { D1ApiKeyRepository } from "../adapters/identity-access/d1-api-key-repository";
import { D1UserRepository } from "../adapters/identity-access/d1-user-repository";
import { hashApiKey, isApiKeyToken } from "./api-key";
import { apiError } from "./http";
import { verifyJwt } from "./jwt";

export interface AuthContext {
  sub: string;
  email: string;
  name: string;
  tokenType: "Bearer" | "ApiKey";
  apiKey?: {
    id: number;
    name: string;
  };
}

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

export async function requireAuth(
  request: Request,
  jwtSecret: string,
  db: D1Database,
): Promise<AuthContext> {
	const token = extractBearerToken(request);

  if (isApiKeyToken(token)) {
    const apiKeyRepository = new D1ApiKeyRepository(db);
    const userRepository = new D1UserRepository(db);
    const apiKey = await apiKeyRepository.findByHash(hashApiKey(token));

    if (!apiKey) {
      throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
    }

    const user = await userRepository.findPublicUserById(apiKey.userId);

    if (!user) {
      throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
    }

    return {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      tokenType: "ApiKey",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
      },
    };
  }

	const payload = await verifyJwt(token, jwtSecret);

	if (!payload) {
		throw apiError(401, "INVALID_TOKEN", "Token bearer ausente ou inválido");
	}

	return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    tokenType: "Bearer",
  };
}
