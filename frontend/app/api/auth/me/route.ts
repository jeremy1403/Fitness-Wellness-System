
import { NextResponse, type NextRequest } from "next/server";

import { backendJson, setAuthCookies } from "@/app/api/auth/_helpers";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";
import { resolvePrimaryRole } from "@/lib/auth/role";
import type { UserResponse } from "@/types/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 },
    );
  }

  const { res, data } = await backendJson<UserResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const response = NextResponse.json(
    data ?? { message: `Request failed (${res.status})` },
    { status: res.status },
  );

  if (res.ok && data?.data) {
    const role = resolvePrimaryRole(data.data.roles) ?? "member";
    setAuthCookies(response, token, role);
  }

  return response;
}
