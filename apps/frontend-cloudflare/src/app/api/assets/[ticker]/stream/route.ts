import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, getBackendBaseUrl } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { ticker } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return new Response(
      JSON.stringify({ error: { message: "Unauthorized" } }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const url = new URL(
    `${getBackendBaseUrl()}/ativos/${encodeURIComponent(ticker)}/stream`,
  );
  const requestUrl = new URL(request.url);
  const assetType = requestUrl.searchParams.get("type");
  if (assetType) {
    url.searchParams.set("type", assetType);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
