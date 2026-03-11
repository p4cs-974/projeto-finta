export interface AuthTokenPayload {
	sub: string;
	email: string;
	name: string;
	iat: number;
	exp: number;
}

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

function toBase64Url(value: string | Uint8Array): string {
	const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

async function importHmacKey(secret: string, usages: Array<"sign" | "verify">): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{
			name: "HMAC",
			hash: "SHA-256",
		},
		false,
		usages,
	);
}

function parseJwtPart<T>(part: string): T | null {
	try {
		return JSON.parse(new TextDecoder().decode(fromBase64Url(part))) as T;
	} catch {
		return null;
	}
}

export async function signJwt(payload: AuthTokenPayload, secret: string): Promise<string> {
	const header = {
		alg: "HS256",
		typ: "JWT",
	};
	const encodedHeader = toBase64Url(JSON.stringify(header));
	const encodedPayload = toBase64Url(JSON.stringify(payload));
	const unsignedToken = `${encodedHeader}.${encodedPayload}`;
	const key = await importHmacKey(secret, ["sign"]);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(unsignedToken),
	);

	return `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
}

function isValidAuthTokenPayload(value: unknown): value is AuthTokenPayload {
	if (!value || typeof value !== "object") {
		return false;
	}

	const payload = value as Record<string, unknown>;

	return (
		typeof payload.sub === "string" &&
		typeof payload.email === "string" &&
		typeof payload.name === "string" &&
		typeof payload.iat === "number" &&
		Number.isFinite(payload.iat) &&
		typeof payload.exp === "number" &&
		Number.isFinite(payload.exp)
	);
}

export async function verifyJwt(token: string, secret: string, now = Date.now()): Promise<AuthTokenPayload | null> {
	const parts = token.split(".");

	if (parts.length !== 3) {
		return null;
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const header = parseJwtPart<{ alg?: string; typ?: string }>(encodedHeader);
	const payload = parseJwtPart<unknown>(encodedPayload);

	if (!header || header.alg !== "HS256" || header.typ !== "JWT" || !isValidAuthTokenPayload(payload)) {
		return null;
	}

	const key = await importHmacKey(secret, ["verify"]);
	const isSignatureValid = await crypto.subtle.verify(
		"HMAC",
		key,
		fromBase64Url(encodedSignature),
		new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
	);

	if (!isSignatureValid) {
		return null;
	}

	if (payload.exp * 1000 <= now) {
		return null;
	}

	return payload;
}
