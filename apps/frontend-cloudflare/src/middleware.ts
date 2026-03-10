import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getSessionFromCookieValue,
  publicRoutes,
} from "@/lib/auth";

function isPublicPath(pathname: string) {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionFromCookieValue(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!session && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
