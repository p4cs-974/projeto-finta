import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET() {
  return proxyBackendRequest("/users/me/favorites");
}
