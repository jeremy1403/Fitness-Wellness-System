const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_API_BASE_URL");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiBaseUrl: normalizeBaseUrl(apiBaseUrl),
  /** Server-only URL for container-to-container calls (falls back to apiBaseUrl) */
  backendUrl: normalizeBaseUrl(process.env.BACKEND_URL ?? apiBaseUrl),
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
