import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams();

  if (url.searchParams.get("q")) {
    params.set("q", url.searchParams.get("q")!);
  }

  if (url.searchParams.get("type") === "crypto") {
    params.set("type", "crypto");
  }

  return proxyBackendRequest(`/ativos/cache-search?${params.toString()}`);
}
