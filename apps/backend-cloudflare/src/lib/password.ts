const PBKDF2_ALGORITHM = "PBKDF2";
const PBKDF2_HASH = "SHA-256";
const PBKDF2_ITERATIONS = 310000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_SALT_LENGTH = 16;

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

async function derivePbkdf2Hash(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		PBKDF2_ALGORITHM,
		false,
		["deriveBits"],
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: PBKDF2_ALGORITHM,
			hash: PBKDF2_HASH,
			iterations: PBKDF2_ITERATIONS,
			salt,
		},
		passwordKey,
		PBKDF2_KEY_LENGTH * 8,
	);

	return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_LENGTH));
	const hash = await derivePbkdf2Hash(password, salt);

	return [
		"pbkdf2",
		"sha256",
		String(PBKDF2_ITERATIONS),
		bytesToBase64Url(salt),
		bytesToBase64Url(hash),
	].join("$");
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
	const [algorithm, digest, iterationsValue, saltValue, hashValue] = encodedHash.split("$");

	if (
		algorithm !== "pbkdf2" ||
		digest !== "sha256" ||
		!iterationsValue ||
		!saltValue ||
		!hashValue
	) {
		return false;
	}

	const iterations = Number(iterationsValue);

	if (!Number.isInteger(iterations) || iterations <= 0) {
		return false;
	}

	const salt = base64UrlToBytes(saltValue);
	const expectedHash = base64UrlToBytes(hashValue);
	const actualHash = await derivePbkdf2Hash(password, salt);

	if (actualHash.length !== expectedHash.length) {
		return false;
	}

	let diff = 0;

	for (let index = 0; index < actualHash.length; index += 1) {
		diff |= actualHash[index] ^ expectedHash[index];
	}

	return diff === 0;
}

export const passwordHashConfig = {
	iterations: PBKDF2_ITERATIONS,
	keyLength: PBKDF2_KEY_LENGTH,
	saltLength: PBKDF2_SALT_LENGTH,
};
