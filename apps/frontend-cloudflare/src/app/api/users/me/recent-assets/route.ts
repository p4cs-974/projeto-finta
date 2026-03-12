import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET() {
  return proxyBackendRequest("/users/me/recent-assets");
}

export async function POST(request: Request) {
  return proxyBackendRequest("/users/me/recent-assets", {
    method: "POST",
    body: await request.text(),
    contentType:
      request.headers.get("content-type") ?? "application/json; charset=utf-8",
  });
}
