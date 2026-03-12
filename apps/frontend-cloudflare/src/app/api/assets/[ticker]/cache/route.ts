import { proxyBackendRequest } from "@/lib/backend-proxy";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ ticker: string }>;
  },
) {
  const { ticker } = await context.params;
  const url = new URL(request.url);
  const params = new URLSearchParams();

  if (url.searchParams.get("type") === "crypto") {
    params.set("type", "crypto");
  }

  const queryString = params.toString();
  return proxyBackendRequest(
    `/ativos/${encodeURIComponent(ticker)}/cache${queryString ? `?${queryString}` : ""}`,
  );
}
