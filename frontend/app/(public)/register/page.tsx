"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel - decorative */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, oklch(0.50 0.14 160 / 0.12) 0%, transparent 55%), radial-gradient(ellipse at 30% 70%, oklch(0.45 0.1 250 / 0.1) 0%, transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />

        <div className="relative z-10">
          <span className="text-sm font-bold tracking-widest text-white/60 uppercase">
            Fitness & Wellness
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <p className="max-w-sm text-lg/relaxed font-light text-white/50">
            Join as a member to book classes, or as a trainer to manage your
            schedule and clients.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Secure &middot; Reliable &middot; Modern
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center bg-slate-50 p-6 lg:bg-white lg:p-12">
        <Card className="w-full max-w-md border-0 bg-transparent shadow-none lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm">
          <CardHeader className="space-y-1 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="text-sm text-slate-500">
              Choose your role and fill in the basics.
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5">
              {/* Role segmented control */}
              <div className="grid gap-2">
                <Label className="text-slate-700">Account type</Label>
                <div className="inline-flex w-full rounded-lg bg-slate-100 p-1">
                  {appRoles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                        role === item
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {roleLabels[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-700">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  required
                  className="h-11"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600">{fieldErrors.name[0]}</p>
                )}
              </div>

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
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="h-11"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation" className="text-slate-700">
                  Confirm password
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="h-11"
                />
                {fieldErrors.password_confirmation && (
                  <p className="text-xs text-red-600">
                    {fieldErrors.password_confirmation[0]}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-1 h-11 w-full bg-slate-900 font-semibold hover:bg-slate-800"
              >
                {submitting
                  ? "Creating account..."
                  : `Create ${roleLabels[role]} account`}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pt-4">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-900 transition hover:text-slate-700"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
