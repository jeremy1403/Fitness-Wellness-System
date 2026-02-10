export type UserRole = "member" | "trainer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "disabled";
  roles: UserRole[];
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: "member" | "trainer";
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export interface AuthResponse {
  message: string;
  data: {
    user: User;
    token?: string;
  };
}

export interface UserResponse {
  data: User;
}

export interface MessageResponse {
  message: string;
}

export interface ApiValidationError {
  message: string;
  errors?: Record<string, string[]>;
}
