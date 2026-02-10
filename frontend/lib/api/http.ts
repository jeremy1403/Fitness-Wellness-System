import { appConfig } from "@/lib/config";
import type { ApiValidationError } from "@/types/auth";

const DEFAULT_BASE = "/api/backend";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  baseUrl?: string;
};

export async function http<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, baseUrl, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const resolvedBase =
    baseUrl ?? (typeof window === "undefined" ? appConfig.api.baseUrl : DEFAULT_BASE);
  const resolvedEndpoint =
    typeof window === "undefined"
      ? `${resolvedBase}/api/${appConfig.api.version}${endpoint}`
      : `${resolvedBase}${endpoint}`;

  const res = await fetch(resolvedEndpoint, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorData: ApiValidationError | null = null;
    try {
      errorData = await res.json();
    } catch {
      // response body wasn't JSON
    }

    throw new ApiError(
      res.status,
      errorData?.message ?? `Request failed (${res.status})`,
      errorData?.errors,
    );
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
