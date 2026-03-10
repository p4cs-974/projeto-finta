export const AUTH_COOKIE_NAME = "finta_session";

export const publicRoutes = ["/login", "/signup"];

export interface AuthSessionPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

interface AuthSuccessResponse {
  data: {
    token: string;
    tokenType: "Bearer";
    expiresIn: number;
    user: {
      id: number;
      name: string;
      email: string;
      createdAt: string;
    };
  };
}

export interface AuthErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
    };
  };
}

const defaultBackendBaseUrl = "http://127.0.0.1:8787";

function decodeBase64Url(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  return atob(padded);
}

export function decodeJwtPayload(token: string): AuthSessionPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as AuthSessionPayload;
  } catch {
    return null;
  }
}

export function isSessionPayloadValid(
  payload: AuthSessionPayload | null | undefined,
): payload is AuthSessionPayload {
  return Boolean(
    payload &&
      typeof payload.sub === "string" &&
      payload.sub.length > 0 &&
      typeof payload.email === "string" &&
      payload.email.length > 0 &&
      typeof payload.name === "string" &&
      payload.name.length > 0 &&
      Number.isFinite(payload.iat) &&
      Number.isFinite(payload.exp),
  );
}

export function isSessionExpired(
  payload: Pick<AuthSessionPayload, "exp">,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  return payload.exp <= nowSeconds;
}

export function getSessionFromCookieValue(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);

  if (!isSessionPayloadValid(payload) || isSessionExpired(payload)) {
    return null;
  }

  return payload;
}

export function sanitizeRedirectTo(redirectTo: string | undefined | null) {
  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  if (redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}

export function getBackendBaseUrl() {
  const configuredBaseUrl = process.env.BACKEND_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return defaultBackendBaseUrl;
  }

  return configuredBaseUrl.replace(/\/+$/, "");
}

export type { AuthSuccessResponse };
