import { ApiError, http } from "./http";
import type { User, UserRole } from "@/types/auth";

export interface UsersListResponse {
  data: User[];
}

export interface UserResponse {
  message?: string;
  data: User;
}

export interface UsersStatsResponse {
  data: { active: number; disabled: number; total: number };
}

const ADMIN_REQUEST_OPTIONS = {
  cache: "no-store" as const,
  credentials: "include" as const,
};

function asRecord(
  value: unknown,
  message: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(500, message);
  }

  return value as Record<string, unknown>;
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ApiError(500, `Invalid ${field} received from backend.`);
  }

  return value;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ApiError(500, `Invalid ${field} received from backend.`);
  }

  return value;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "trainer" || value === "member";
}

function isUserStatus(value: unknown): value is User["status"] {
  return value === "active" || value === "disabled";
}

function readRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isUserRole);
}

function parseUser(value: unknown): User {
  const record = asRecord(value, "Invalid user record received from backend.");
  const status = record.status;

  if (!isUserStatus(status)) {
    throw new ApiError(500, "Invalid user status received from backend.");
  }

  return {
    id: readNumber(record.id, "user id"),
    name: readString(record.name, "user name"),
    email: readString(record.email, "user email"),
    status,
    roles: readRoles(record.roles),
    created_at: readString(record.created_at, "user created date"),
    updated_at: readString(record.updated_at, "user updated date"),
  };
}

function parseUsersListResponse(value: unknown): UsersListResponse {
  const record = asRecord(value, "Invalid users response received from backend.");

  if (!Array.isArray(record.data)) {
    throw new ApiError(500, "Invalid users list received from backend.");
  }

  return {
    data: record.data.map(parseUser),
  };
}

function parseUserResponse(value: unknown): UserResponse {
  const record = asRecord(value, "Invalid user response received from backend.");

  return {
    message:
      typeof record.message === "string" ? record.message : undefined,
    data: parseUser(record.data),
  };
}

function parseUsersStatsResponse(value: unknown): UsersStatsResponse {
  const record = asRecord(value, "Invalid user stats response received from backend.");
  const data = asRecord(record.data, "Invalid user stats payload received from backend.");

  return {
    data: {
      active: readNumber(data.active, "active user count"),
      disabled: readNumber(data.disabled, "disabled user count"),
      total: readNumber(data.total, "total user count"),
    },
  };
}

export const adminApi = {
  async getUsers() {
    const response = await http<unknown>("/auth/users", ADMIN_REQUEST_OPTIONS);

    return parseUsersListResponse(response);
  },

  async getUserStats() {
    const response = await http<unknown>("/auth/users/stats", ADMIN_REQUEST_OPTIONS);

    return parseUsersStatsResponse(response);
  },

  async getUser(id: number) {
    const response = await http<unknown>(`/auth/users/${id}`, ADMIN_REQUEST_OPTIONS);

    return parseUserResponse(response);
  },

  async updateUserStatus(id: number, status: "active" | "disabled") {
    const response = await http<unknown>(`/auth/users/${id}/status`, {
      ...ADMIN_REQUEST_OPTIONS,
      method: "PATCH",
      body: { status },
    });

    return parseUserResponse(response);
  },

  async assignRole(id: number, role: string) {
    const response = await http<unknown>(`/auth/users/${id}/roles`, {
      ...ADMIN_REQUEST_OPTIONS,
      method: "POST",
      body: { role },
    });

    return parseUserResponse(response);
  },

  async removeRole(id: number, role: string) {
    const response = await http<unknown>(`/auth/users/${id}/roles`, {
      ...ADMIN_REQUEST_OPTIONS,
      method: "DELETE",
      body: { role },
    });

    return parseUserResponse(response);
  },

  async changeRole(id: number, currentRoles: UserRole[], newRole: string) {
    for (const role of currentRoles) {
      if (role !== newRole) {
        await adminApi.removeRole(id, role);
      }
    }

    if (!currentRoles.includes(newRole as UserRole)) {
      return adminApi.assignRole(id, newRole);
    }

    return adminApi.getUser(id);
  },
};
