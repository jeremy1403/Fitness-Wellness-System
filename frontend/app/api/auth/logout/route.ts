import { NextResponse, type NextRequest } from "next/server";

import { backendJson, clearAuthCookies } from "@/app/api/auth/_helpers";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";
import type { MessageResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const { res, data } = await backendJson<MessageResponse>("/auth/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const response = NextResponse.json(
    data ?? { message: res.ok ? "Logged out." : `Request failed (${res.status})` },
    { status: res.status },
  );

  clearAuthCookies(response);
  return response;
}
