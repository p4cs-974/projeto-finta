import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyBackendRequest("/users/me/activity/searches", {
    method: "POST",
    body: await request.text(),
    contentType:
      request.headers.get("content-type") ?? "application/json; charset=utf-8",
  });
}
