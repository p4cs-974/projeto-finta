import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { proxyBackendRequest } from "./backend-proxy";

function createSessionToken(payload: {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}

function mockCookieStore(token?: string) {
  cookiesMock.mockResolvedValue({
    get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
  });
}

describe("proxyBackendRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 401 when the session cookie is missing", async () => {
    mockCookieStore();

    const response = await proxyBackendRequest("/users/me/favorites");
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("repasses a 200 response body from the backend", async () => {
    mockCookieStore(
      createSessionToken({
        sub: "1",
        email: "pedro@example.com",
        name: "Pedro",
        iat: 1_900_000_000,
        exp: 1_900_003_600,
      }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ symbol: "PETR4" }] }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }),
    );

    const response = await proxyBackendRequest("/users/me/favorites");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ symbol: "PETR4" }],
    });
  });

  it("repasses a 401 response body from the backend", async () => {
    mockCookieStore(
      createSessionToken({
        sub: "1",
        email: "pedro@example.com",
        name: "Pedro",
        iat: 1_900_000_000,
        exp: 1_900_003_600,
      }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOKEN",
            message: "Token bearer ausente ou inválido",
          },
        }),
        {
          status: 401,
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      ),
    );

    const response = await proxyBackendRequest("/users/me/favorites");
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_TOKEN");
  });

  it("returns 502 when the backend is unavailable", async () => {
    mockCookieStore(
      createSessionToken({
        sub: "1",
        email: "pedro@example.com",
        name: "Pedro",
        iat: 1_900_000_000,
        exp: 1_900_003_600,
      }),
    );
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const response = await proxyBackendRequest("/users/me/favorites");
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("UPSTREAM_UNAVAILABLE");
  });
});
