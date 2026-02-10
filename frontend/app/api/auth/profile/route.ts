import { NextResponse, type NextRequest } from "next/server";

import { backendJson } from "@/app/api/auth/_helpers";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";
import type { UserResponse } from "@/types/auth";

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 },
    );
  }

  const payload = await request.json();

  const { res, data } = await backendJson<{ message: string; data: UserResponse["data"] }>(
    "/auth/profile",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return NextResponse.json(
    data ?? { message: `Request failed (${res.status})` },
    { status: res.status },
  );
}
