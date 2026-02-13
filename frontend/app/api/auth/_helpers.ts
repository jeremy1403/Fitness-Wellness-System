import { NextResponse } from "next/server";

import { backendUrl, readJson } from "@/lib/api/backend";
import { AUTH_COOKIE_MAX_AGE, ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/auth/cookies";

const isProd = process.env.NODE_ENV === "production";

export async function backendJson<T>(
  path: string,
  init: RequestInit,
): Promise<{ res: Response; data: T | null }> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const url = backendUrl(path);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
    });

    return { res, data: await readJson<T>(res) };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown network error";
    const fallback = {
      message:
        "Unable to reach backend API. Check NEXT_PUBLIC_API_BASE_URL and backend server status.",
      error: detail,
      url,
    } as T;

    return { res: new Response(null, { status: 502 }), data: fallback };
  }
}

export function setAuthCookies(
  response: NextResponse,
  token: string,
  role: string,
) {
  const baseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };

  response.cookies.set({ name: TOKEN_COOKIE, value: token, ...baseOptions });
  response.cookies.set({ name: ROLE_COOKIE, value: role, ...baseOptions });
}

export function clearAuthCookies(response: NextResponse) {
  const baseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set({ name: TOKEN_COOKIE, value: "", ...baseOptions });
  response.cookies.set({ name: ROLE_COOKIE, value: "", ...baseOptions });
}
