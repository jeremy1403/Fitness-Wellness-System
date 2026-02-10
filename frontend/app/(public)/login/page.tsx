"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";

const userRoles = ["member", "trainer", "admin"] as const;
type UserRole = (typeof userRoles)[number];

const roleLabels: Record<UserRole, string> = {
  member: "Member",
  trainer: "Trainer",
  admin: "Admin",
};

const isUserRole = (v?: string | null): v is UserRole =>
  !!v && (userRoles as readonly string[]).includes(v);

function LoginForm() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const roleParam = searchParams.get("role");

  const [role, setRole] = useState<UserRole>(
    isUserRole(roleParam) ? roleParam : "member",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isUserRole(roleParam)) setRole(roleParam);
  }, [roleParam]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      await login({ email, password });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.errors) setFieldErrors(e.errors);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {userRoles.map((item) => (
              <label
                key={item}
                className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                  role === item
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item}
                  className="sr-only"
                  checked={role === item}
                  onChange={() => setRole(item)}
                />
                {roleLabels[item]}
              </label>
            ))}
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.email[0]}
                </p>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/register" className="font-semibold text-teal-600">
          Create a member or trainer account
        </Link>
        <Link href="/forgot-password" className="font-semibold text-slate-500">
          Forgot password
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Sign in
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">
            Enter your credentials to sign in.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
