import { NextRequest, NextResponse } from "next/server";

import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/auth/cookies";

const publicPaths = ["/login", "/register", "/forgot-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Authenticated user visiting public auth pages → redirect to dashboard
  if (isPublic && token) {
    const dest = role === "admin" ? "/admin" : "/app";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Unauthenticated user visiting protected routes → redirect to login
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    if (pathname.startsWith("/admin")) {
      loginUrl.searchParams.set("role", "admin");
    }
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require admin role
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
