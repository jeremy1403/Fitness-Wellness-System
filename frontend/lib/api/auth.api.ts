import { http } from "./http";
import type {
  AuthResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  UpdateProfilePayload,
  UserResponse,
} from "@/types/auth";

const BASE = "";
const AUTH_BASE_URL = "/api/auth";

export const authApi = {
  login(payload: LoginPayload) {
    return http<AuthResponse>(`${BASE}/login`, {
      method: "POST",
      body: payload,
      baseUrl: AUTH_BASE_URL,
    });
  },

  register(payload: RegisterPayload) {
    return http<AuthResponse>(`${BASE}/register`, {
      method: "POST",
      body: payload,
      baseUrl: AUTH_BASE_URL,
    });
  },

  logout() {
    return http<MessageResponse>(`${BASE}/logout`, {
      method: "POST",
      baseUrl: AUTH_BASE_URL,
    });
  },

  me() {
    return http<UserResponse>(`${BASE}/me`, {
      baseUrl: AUTH_BASE_URL,
    });
  },

  updateProfile(payload: UpdateProfilePayload) {
    return http<{ message: string; data: UserResponse["data"] }>(
      `${BASE}/profile`,
      { method: "PUT", body: payload, baseUrl: AUTH_BASE_URL },
    );
  },
};
