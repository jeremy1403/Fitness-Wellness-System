import { NextResponse, type NextRequest } from "next/server";

import { backendUrl } from "@/lib/api/backend";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const url = backendUrl(`/${path.join("/")}`);

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const res = await fetch(url, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
