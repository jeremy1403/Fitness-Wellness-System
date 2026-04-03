import { NextResponse, type NextRequest } from "next/server";

import { backendUrl } from "@/lib/api/backend";
import { TOKEN_COOKIE } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ path: string[] }> };
const RESPONSE_HEADERS_TO_FORWARD = ["content-type", "etag", "last-modified"] as const;

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  const url = `${backendUrl(pathname)}${request.nextUrl.search}`;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
    });

    for (const headerName of RESPONSE_HEADERS_TO_FORWARD) {
      const value = res.headers.get(headerName);
      if (value) {
        responseHeaders.set(headerName, value);
      }
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown network error";

    return NextResponse.json(
      {
        message:
          "Unable to reach backend API. Check NEXT_PUBLIC_API_BASE_URL and backend server status.",
        error: detail,
        url,
      },
      { status: 502 },
    );
  }
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
