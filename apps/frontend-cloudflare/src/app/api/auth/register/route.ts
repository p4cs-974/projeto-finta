import type { BearerAuthSessionResponseBody } from "@finta/identity-access";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getBackendBaseUrl } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(`${getBackendBaseUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "content-type":
          request.headers.get("content-type") ??
          "application/json; charset=utf-8",
      },
      body,
      cache: "no-store",
    });

    const contentType =
      response.headers.get("content-type") ?? "application/json; charset=utf-8";
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(payload, {
        status: response.status,
        headers: {
          "content-type": contentType,
        },
      });
    }

    const successPayload = payload as BearerAuthSessionResponseBody;
    const nextResponse = NextResponse.json(successPayload, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });

    nextResponse.cookies.set(AUTH_COOKIE_NAME, successPayload.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: successPayload.data.expiresIn,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Authentication service is unavailable",
        },
      },
      { status: 502 },
    );
  }
}
