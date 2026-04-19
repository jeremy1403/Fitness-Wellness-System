import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendUrl, readJson } from "@/lib/api/backend";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";

export async function membershipBackendJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; data: T | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = backendUrl(path);

  try {
    const res = await fetch(url, { ...init, headers });
    return { res, data: await readJson<T>(res) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const fallback = {
      message: "Unable to reach backend API.",
      error: detail,
    } as T;
    return { res: new Response(null, { status: 502 }), data: fallback };
  }
}

export function jsonResponse(data: unknown, status: number) {
  return NextResponse.json(data ?? { message: "No response" }, { status });
}