import { describe, expect, it, vi } from "vitest";

const { proxyBackendRequest } = vi.hoisted(() => ({
  proxyBackendRequest: vi.fn(),
}));

vi.mock("@/lib/backend-proxy", () => ({
  proxyBackendRequest,
}));

import { GET } from "./route";

describe("GET /api/users/me/favorites", () => {
  it("proxies to the backend favorites endpoint", async () => {
    const response = new Response(null, { status: 200 });
    proxyBackendRequest.mockResolvedValueOnce(response);

    const result = await GET();

    expect(proxyBackendRequest).toHaveBeenCalledWith("/users/me/favorites");
    expect(result).toBe(response);
  });
});
