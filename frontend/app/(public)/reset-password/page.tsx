"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LockKeyhole, AlertCircle } from "lucide-react";
import { AuthHeroPanel } from "@/components/decor/AuthHeroPanel";

type Strength = {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
};

function scorePassword(password: string): Strength {
  if (!password) return { score: 0, label: "—", color: "bg-slate-200" };
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (points <= 3) return { score: 2, label: "Good", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const missingParams = !token || !email;
  const strength = useMemo(() => scorePassword(password), [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push("/login?reset=success");
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <Card className="border-0 bg-transparent shadow-none lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm">
        <CardHeader className="space-y-3 pb-6">
          <motion.div
            initial={{ rotate: -6, scale: 0.9, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
            className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"
          >
            <LockKeyhole className="size-5" />
          </motion.div>
          <span className="inline-flex items-center self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
            Password reset
          </span>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900">
            Choose a <em className="italic text-indigo-700">new</em> password
          </h1>
          <p className="text-sm text-slate-500">
            {email ? (
              <>
                Resetting password for{" "}
                <span className="font-medium text-slate-700">{email}</span>.
              </>
            ) : (
              "Your reset link is missing required information."
            )}
          </p>
        </CardHeader>

        <CardContent>
          {missingParams ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: [0.9, 1.08, 1],
                  opacity: 1,
                }}
                transition={{
                  duration: 0.7,
                  ease: "easeOut",
                  times: [0, 0.6, 1],
                }}
              >
                <AlertCircle className="size-12 text-amber-500" />
              </motion.div>
              <div>
                <p className="mb-1 text-sm font-semibold text-slate-700">
                  Invalid or expired link
                </p>
                <p className="mb-4 text-xs text-slate-400">
                  This reset link is missing required information. Please request a
                  new one.
                </p>
              </div>
              <Button asChild variant="outline" className="h-11 w-full">
                <Link href="/forgot-password">Request a new reset link</Link>
              </Button>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-slate-700">
                    New password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />

                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3].map((i) => {
                        const active = strength.score >= i;
                        return (
                          <motion.span
                            key={i}
                            initial={false}
                            animate={{
                              backgroundColor: active
                                ? i === 1
                                  ? "oklch(0.637 0.208 25)"
                                  : i === 2
                                    ? "oklch(0.769 0.188 70)"
                                    : "oklch(0.696 0.17 162)"
                                : "oklch(0.929 0.013 255)",
                              scaleX: active ? 1 : 0.9,
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-1.5 flex-1 origin-left rounded-full"
                          />
                        );
                      })}
                    </div>
                    <span className="w-12 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {strength.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Use 8+ characters with letters and numbers.
                  </p>
                  {fieldErrors.password && (
                    <p className="text-xs text-rose-600">{fieldErrors.password[0]}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="password_confirmation"
                    className="text-slate-700"
                  >
                    Confirm new password
                  </Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="h-11"
                  />
                  {fieldErrors.password_confirmation && (
                    <p className="text-xs text-rose-600">
                      {fieldErrors.password_confirmation[0]}
                    </p>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 h-11 w-full bg-indigo-700 font-semibold hover:bg-indigo-600"
                  >
                    {submitting ? "Resetting..." : "Reset password"}
                  </Button>
                </motion.div>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="justify-center pt-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 border-t border-slate-200" />
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthHeroPanel
        tone="indigo"
        quote="A new key. A new start."
        footer="Secure · Reliable · Modern"
      />

      <div className="flex items-center justify-center bg-slate-50 p-6 lg:bg-white lg:p-12">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
