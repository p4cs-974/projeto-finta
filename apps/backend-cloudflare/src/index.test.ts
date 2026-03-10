import { describe, expect, it } from "vitest";

import worker from "./index";
import { hashPassword } from "./lib/password";
import { createFakeD1Database } from "./test/fake-d1";

const JWT_SECRET = "test-secret";

function createAuthRequest(pathname: string, body: string, contentType = "application/json") {
	return new Request(`http://localhost${pathname}`, {
		method: "POST",
		headers: {
			"content-type": contentType,
		},
		body,
	});
}

describe("POST /auth/register", () => {
	it("creates the user, normalizes the email and returns a bearer token", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: "Pedro Custodio",
					email: "Pedro@Example.com ",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			data: {
				user: {
					id: number;
					name: string;
					email: string;
					createdAt: string;
				};
				token: string;
				tokenType: string;
				expiresIn: number;
			};
		}>();

		expect(response.status).toBe(201);
		expect(payload.data.user).toMatchObject({
			id: 1,
			name: "Pedro Custodio",
			email: "pedro@example.com",
		});
		expect(new Date(payload.data.user.createdAt).toISOString()).toBe(payload.data.user.createdAt);
		expect(payload.data.tokenType).toBe("Bearer");
		expect(payload.data.expiresIn).toBe(3600);
		expect(payload.data.token.split(".")).toHaveLength(3);
		expect(JSON.stringify(payload)).not.toContain("password_hash");
		expect(fakeDb.getUsers()).toHaveLength(1);
		expect(fakeDb.getUsers()[0]?.email).toBe("pedro@example.com");
		expect(fakeDb.getUsers()[0]?.password_hash).toMatch(/^pbkdf2\$sha256\$310000\$/);
	});

	it("stores and returns normalized accented names consistently", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: " Jose\u0301   A\u0301lvares ",
					email: "jose@example.com",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			data: {
				user: {
					name: string;
				};
			};
		}>();

		expect(response.status).toBe(201);
		expect(payload.data.user.name).toBe("José Álvares");
		expect(fakeDb.getUsers()[0]?.name).toBe("José Álvares");
		expect(fakeDb.getUsers()[0]?.name).toBe(fakeDb.getUsers()[0]?.name.normalize("NFC"));
	});

	it("returns 409 for duplicate emails ignoring casing", async () => {
		const fakeDb = createFakeD1Database();

		fakeDb.seedUser({
			name: "Existing User",
			email: "pedro@example.com",
			password_hash: "pbkdf2$sha256$310000$salt$hash",
		});

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: "Pedro Custodio",
					email: "PEDRO@example.com",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(409);
		expect(payload.error.code).toBe("EMAIL_ALREADY_IN_USE");
	});

	it("returns 422 for invalid payloads", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: "P",
					email: "invalid-email",
					password: "123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			error: {
				code: string;
				details: {
					fieldErrors: Record<string, string[]>;
				};
			};
		}>();

		expect(response.status).toBe(422);
		expect(payload.error.code).toBe("VALIDATION_ERROR");
		expect(payload.error.details.fieldErrors.name).toBeTruthy();
		expect(payload.error.details.fieldErrors.email).toBeTruthy();
		expect(payload.error.details.fieldErrors.password).toBeTruthy();
	});

	it("returns 422 when the name contains control characters", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: "Pedro\u0000Custodio",
					email: "pedro@example.com",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			error: {
				code: string;
				details: {
					fieldErrors: Record<string, string[]>;
				};
			};
		}>();

		expect(response.status).toBe(422);
		expect(payload.error.code).toBe("VALIDATION_ERROR");
		expect(payload.error.details.fieldErrors.name).toBeTruthy();
	});

	it("returns 400 for malformed JSON", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(createAuthRequest("/auth/register", '{"name":"Pedro"'), {
			DB: fakeDb.db,
			JWT_SECRET,
		});
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(400);
		expect(payload.error.code).toBe("INVALID_JSON");
	});

	it("returns 415 for unsupported media types", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/register",
				JSON.stringify({
					name: "Pedro Custodio",
					email: "pedro@example.com",
					password: "SenhaSegura123",
				}),
				"text/plain",
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(415);
		expect(payload.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
	});
});

describe("POST /auth/login", () => {
	it("logs in an existing user and returns a bearer token with the public user", async () => {
		const fakeDb = createFakeD1Database();
		const passwordHash = await hashPassword("SenhaSegura123");

		fakeDb.seedUser({
			name: "Pedro Custodio",
			email: "pedro@example.com",
			password_hash: passwordHash,
		});

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: "pedro@example.com",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			data: {
				user: {
					id: number;
					name: string;
					email: string;
					createdAt: string;
				};
				token: string;
				tokenType: string;
				expiresIn: number;
			};
		}>();

		expect(response.status).toBe(200);
		expect(payload.data.user).toMatchObject({
			id: 1,
			name: "Pedro Custodio",
			email: "pedro@example.com",
		});
		expect(new Date(payload.data.user.createdAt).toISOString()).toBe(payload.data.user.createdAt);
		expect(payload.data.tokenType).toBe("Bearer");
		expect(payload.data.expiresIn).toBe(3600);
		expect(payload.data.token.split(".")).toHaveLength(3);
		expect(JSON.stringify(payload)).not.toContain("password_hash");
	});

	it("normalizes email casing and whitespace before lookup", async () => {
		const fakeDb = createFakeD1Database();
		const passwordHash = await hashPassword("SenhaSegura123");

		fakeDb.seedUser({
			name: "Pedro Custodio",
			email: "pedro@example.com",
			password_hash: passwordHash,
		});

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: " Pedro@Example.com ",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);

		expect(response.status).toBe(200);
	});

	it("returns 401 for unknown emails", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: "pedro@example.com",
					password: "SenhaSegura123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{ error: { code: string; message: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_CREDENTIALS");
		expect(payload.error.message).toBe("Invalid email or password");
	});

	it("returns 401 for wrong passwords", async () => {
		const fakeDb = createFakeD1Database();
		const passwordHash = await hashPassword("SenhaSegura123");

		fakeDb.seedUser({
			name: "Pedro Custodio",
			email: "pedro@example.com",
			password_hash: passwordHash,
		});

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: "pedro@example.com",
					password: "SenhaErrada123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(401);
		expect(payload.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("returns 422 for invalid payloads", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: "invalid-email",
					password: "123",
				}),
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{
			error: {
				code: string;
				details: {
					fieldErrors: Record<string, string[]>;
				};
			};
		}>();

		expect(response.status).toBe(422);
		expect(payload.error.code).toBe("VALIDATION_ERROR");
		expect(payload.error.details.fieldErrors.email).toBeTruthy();
		expect(payload.error.details.fieldErrors.password).toBeTruthy();
	});

	it("returns 400 for malformed JSON", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(createAuthRequest("/auth/login", '{"email":"pedro@example.com"'), {
			DB: fakeDb.db,
			JWT_SECRET,
		});
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(400);
		expect(payload.error.code).toBe("INVALID_JSON");
	});

	it("returns 415 for unsupported media types", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(
			createAuthRequest(
				"/auth/login",
				JSON.stringify({
					email: "pedro@example.com",
					password: "SenhaSegura123",
				}),
				"text/plain",
			),
			{
				DB: fakeDb.db,
				JWT_SECRET,
			},
		);
		const payload = await response.json<{ error: { code: string } }>();

		expect(response.status).toBe(415);
		expect(payload.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
	});
});

describe("documentation routes", () => {
	it("serves the OpenAPI document", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(new Request("http://localhost/openapi.json"), {
			DB: fakeDb.db,
			JWT_SECRET,
		});
		const payload = await response.json<{
			openapi: string;
			paths: Record<string, unknown>;
			servers: Array<{ url: string }>;
		}>();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(payload.openapi).toBe("3.1.1");
		expect(payload.paths["/auth/login"]).toBeTruthy();
		expect(payload.paths["/auth/register"]).toBeTruthy();
		expect(payload.servers[0]?.url).toBe("http://localhost");
	});

	it("serves Swagger UI HTML", async () => {
		const fakeDb = createFakeD1Database();

		const response = await worker.fetch(new Request("http://localhost/docs"), {
			DB: fakeDb.db,
			JWT_SECRET,
		});
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(html).toContain("swagger-ui");
		expect(html).toContain("http://localhost/openapi.json");
	});
});
