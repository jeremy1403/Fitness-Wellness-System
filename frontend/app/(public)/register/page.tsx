"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";

const appRoles = ["member", "trainer"] as const;
type AppRole = (typeof appRoles)[number];

const roleLabels: Record<AppRole, string> = {
  member: "Member",
  trainer: "Trainer",
};

export default function RegisterPage() {
  const { register } = useAuth();

  const [role, setRole] = useState<AppRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const password = form.get("password") as string;
    const passwordConfirmation = form.get("password_confirmation") as string;

    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.get("name") as string,
        email: form.get("email") as string,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      // register() handles redirect internally
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
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Registration
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-600">
            Choose member or trainer, then fill in the basics.
          </p>
        </div>

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
            <div className="grid gap-3 sm:grid-cols-2">
              {appRoles.map((item) => (
                <label
                  key={item}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    role === item
                      ? "border-teal-500 bg-teal-500 text-white"
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
                Full name
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.name[0]}
                  </p>
                )}
              </label>
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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                  required
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </label>
              <label className="text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                  required
                />
                {fieldErrors.password_confirmation && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.password_confirmation[0]}
                  </p>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-50"
            >
              {submitting ? "Creating account..." : `Create ${roleLabels[role]} account`}
            </button>
          </div>
        </form>

        <div className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-slate-900">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
