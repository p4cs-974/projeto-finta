import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getBackendBaseUrl,
  getSessionFromCookieValue,
} from "@/lib/auth";

function invalidTokenResponse() {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_TOKEN",
        message: "Missing or invalid bearer token",
      },
    },
    { status: 401 },
  );
}

export async function proxyBackendRequest(
  path: string,
  init: RequestInit & {
    contentType?: string | null;
  } = {},
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = getSessionFromCookieValue(token);

  if (!token || !session) {
    return invalidTokenResponse();
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...(init.contentType
          ? {
              "content-type": init.contentType,
            }
          : {}),
        authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });

    const contentType =
      response.headers.get("content-type") ?? "application/json; charset=utf-8";
    const body = response.status === 204 ? null : await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Backend service is unavailable",
        },
      },
      { status: 502 },
    );
  }
}
