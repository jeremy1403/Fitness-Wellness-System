import { NextResponse, type NextRequest } from "next/server";

import { resolvePrimaryRole } from "@/lib/auth/role";
import { backendJson, setAuthCookies } from "@/app/api/auth/_helpers";
import type { AuthResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const { res, data } = await backendJson<AuthResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !data) {
    return NextResponse.json(
      data ?? { message: `Request failed (${res.status})` },
      { status: res.status },
    );
  }

  const { user, token } = data.data;
  if (!token) {
    return NextResponse.json(
      { message: "Missing auth token from backend." },
      { status: 502 },
    );
  }

  const role = resolvePrimaryRole(user.roles) ?? "member";
  const response = NextResponse.json({
    message: data.message,
    data: { user },
  });
  setAuthCookies(response, token, role);
  return response;
}
