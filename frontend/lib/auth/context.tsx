"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/http";
import { resolvePrimaryRole } from "@/lib/auth/role";
import type {
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
  UserRole,
} from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /** Primary role used for routing (first role from the array). */
  primaryRole: UserRole | null;
}

interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user from /auth/me on mount
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await authApi.login(payload);
      const { user: loggedInUser } = res.data;
      const role = resolvePrimaryRole(loggedInUser.roles);
      setUser(loggedInUser);
      router.push(role === "admin" ? "/admin" : "/app");
    },
    [router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const res = await authApi.register(payload);
      const { user: newUser } = res.data;
      const role = resolvePrimaryRole(newUser.roles);
      setUser(newUser);
      router.push("/app");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // If 401 (token already expired), still clear local state
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const res = await authApi.updateProfile(payload);
    setUser(res.data);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => user?.roles.includes(role) ?? false,
    [user],
  );

  const primaryRole = useMemo(
    () => (user ? resolvePrimaryRole(user.roles) : null),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      primaryRole,
      login,
      register,
      logout,
      updateProfile,
      hasRole,
    }),
    [user, isLoading, primaryRole, login, register, logout, updateProfile, hasRole],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
