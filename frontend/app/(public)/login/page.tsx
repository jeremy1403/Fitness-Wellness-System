"use client";

import Link from "next/link";
import type React from "react";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const { login } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

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
    <Card className="w-full max-w-md border-0 bg-transparent shadow-none lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500">
          Enter your credentials to access your account.
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-11"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="h-11"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-600">{fieldErrors.password[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-1 h-11 w-full bg-slate-900 font-semibold hover:bg-slate-800"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pt-4">
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-slate-900 transition hover:text-slate-700"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel - decorative */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex">
        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, oklch(0.55 0.12 55 / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, oklch(0.45 0.1 250 / 0.1) 0%, transparent 50%)",
          }}
        />

        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <span className="text-sm font-bold tracking-widest text-white/60 uppercase">
            Fitness & Wellness
          </span>
        </div>

        {/* Central decorative element */}
        <div className="relative z-10 flex flex-col gap-4">
          <p className="max-w-sm text-lg/relaxed font-light text-white/50">
            Your all-in-one platform for fitness class management, bookings, and
            membership tracking.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Secure &middot; Reliable &middot; Modern
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center bg-slate-50 p-6 lg:bg-white lg:p-12">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
