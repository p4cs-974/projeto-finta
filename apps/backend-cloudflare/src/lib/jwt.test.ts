import { describe, expect, it } from "vitest";

import { signJwt } from "./jwt";

function decodeBase64UrlJson<T>(value: string): T {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	return JSON.parse(atob(padded)) as T;
}

describe("JWT helpers", () => {
	it("signs HS256 tokens with the expected header and payload", async () => {
		const token = await signJwt(
			{
				sub: "1",
				email: "pedro@example.com",
				name: "Pedro Custodio",
				iat: 1_741_608_000,
				exp: 1_741_611_600,
			},
			"test-secret",
		);
		const [header, payload, signature] = token.split(".");

		expect(signature).toBeTruthy();
		expect(decodeBase64UrlJson<{ alg: string; typ: string }>(header)).toEqual({
			alg: "HS256",
			typ: "JWT",
		});
		expect(
			decodeBase64UrlJson<{
				sub: string;
				email: string;
				name: string;
				iat: number;
				exp: number;
			}>(payload),
		).toEqual({
			sub: "1",
			email: "pedro@example.com",
			name: "Pedro Custodio",
			iat: 1_741_608_000,
			exp: 1_741_611_600,
		});
	});
});
