import "server-only";

import { appConfig } from "@/lib/config";

const API_BASE = `${appConfig.api.baseUrl}/api/${appConfig.api.version}`;

export function backendUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
