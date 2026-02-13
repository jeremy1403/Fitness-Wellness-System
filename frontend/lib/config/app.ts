import { env } from "./env";

export const appConfig = {
  name: "Fitness & Wellness",
  description: "Fitness and wellness platform",
  api: {
    baseUrl: env.apiBaseUrl,
    /** Internal URL for server-side container-to-container calls */
    backendUrl: env.backendUrl,
    version: "v1",
  },
} as const;
