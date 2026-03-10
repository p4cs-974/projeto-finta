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

export async function signJwt(payload: AuthTokenPayload, secret: string): Promise<string> {
	const header = {
		alg: "HS256",
		typ: "JWT",
	};
	const encodedHeader = toBase64Url(JSON.stringify(header));
	const encodedPayload = toBase64Url(JSON.stringify(payload));
	const unsignedToken = `${encodedHeader}.${encodedPayload}`;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{
			name: "HMAC",
			hash: "SHA-256",
		},
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(unsignedToken),
	);

	return `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
}
