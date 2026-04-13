import { describe, expect, it } from "vitest";

import { hashApiKey } from "./api-key";
import { requireAuth } from "./auth";
import { signJwt } from "./jwt";
import { createFakeD1Database } from "../test/fake-d1";

const JWT_SECRET = "test-secret";

function createRequest(token?: string) {
  return new Request("http://localhost/protected", {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}

describe("requireAuth", () => {
  it("verifies JWT tokens and returns the auth payload", async () => {
    const token = await signJwt(
      {
        sub: "1",
        email: "pedro@example.com",
        name: "Pedro Custodio",
        iat: 1_900_000_000,
        exp: 1_900_003_600,
      },
      JWT_SECRET,
    );

    await expect(
      requireAuth(createRequest(token), JWT_SECRET, createFakeD1Database().db),
    ).resolves.toMatchObject({
      sub: "1",
      email: "pedro@example.com",
      name: "Pedro Custodio",
      tokenType: "Bearer",
    });
  });

  it("uses the API key path for finta_ prefixed tokens", async () => {
    const fakeDb = createFakeD1Database();
    const user = fakeDb.seedUser({
      name: "Pedro Custodio",
      email: "pedro@example.com",
      password_hash: "hashed-password",
    });
    const rawKey = "finta_test-api-key";
    fakeDb.seedApiKey({
      user_id: user.id,
      key_hash: hashApiKey(rawKey),
      name: "CLI - host - 2026-04-12",
      created_at: "2026-04-12 10:00:00",
    });

    await expect(requireAuth(createRequest(rawKey), JWT_SECRET, fakeDb.db))
      .resolves.toMatchObject({
        sub: String(user.id),
        email: "pedro@example.com",
        name: "Pedro Custodio",
        tokenType: "ApiKey",
        apiKey: {
          id: 1,
          name: "CLI - host - 2026-04-12",
        },
      });
  });

  it("returns 401 for revoked or invalid API keys", async () => {
    await expect(
      requireAuth(
        createRequest("finta_missing"),
        JWT_SECRET,
        createFakeD1Database().db,
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_TOKEN",
    });
  });

  it("returns 401 for non-prefixed non-JWT tokens", async () => {
    await expect(
      requireAuth(createRequest("not-a-jwt"), JWT_SECRET, createFakeD1Database().db),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_TOKEN",
    });
  });

  it("returns 401 when the bearer header is missing", async () => {
    await expect(
      requireAuth(createRequest(), JWT_SECRET, createFakeD1Database().db),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_TOKEN",
    });
  });
});
