import { env } from "./env";

export const appConfig = {
  name: "Fitness & Wellness",
  description: "Fitness and wellness platform",
  api: {
    baseUrl: env.apiBaseUrl,
    version: "v1",
  },
} as const;
