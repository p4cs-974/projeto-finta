import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_SALT_LENGTH = 16;
const PBKDF2_DIGEST = "sha256";
const derivePbkdf2 = promisify(pbkdf2);

function bytesToBase64Url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(value: string): Uint8Array {
	return new Uint8Array(Buffer.from(value, "base64url"));
}

async function derivePbkdf2Hash(
	password: string,
	salt: Uint8Array,
	iterations: number,
): Promise<Uint8Array> {
	const derivedBits = await derivePbkdf2(
		password,
		Buffer.from(salt),
		iterations,
		PBKDF2_KEY_LENGTH,
		PBKDF2_DIGEST,
	);

	return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(PBKDF2_SALT_LENGTH);
	const hash = await derivePbkdf2Hash(password, salt, PBKDF2_ITERATIONS);

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
	const actualHash = await derivePbkdf2Hash(password, salt, iterations);

	if (actualHash.length !== expectedHash.length) {
		return false;
	}

	return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

export const passwordHashConfig = {
	iterations: PBKDF2_ITERATIONS,
	keyLength: PBKDF2_KEY_LENGTH,
	saltLength: PBKDF2_SALT_LENGTH,
};
