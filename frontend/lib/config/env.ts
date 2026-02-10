const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_API_BASE_URL");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiBaseUrl: normalizeBaseUrl(apiBaseUrl),
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
