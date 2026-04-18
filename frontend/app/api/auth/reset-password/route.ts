import { NextResponse, type NextRequest } from "next/server";

import { backendJson } from "@/app/api/auth/_helpers";
import type { MessageResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const { res, data } = await backendJson<MessageResponse>(
    "/auth/reset-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return NextResponse.json(
    data ?? { message: `Request failed (${res.status})` },
    { status: res.status },
  );
}
