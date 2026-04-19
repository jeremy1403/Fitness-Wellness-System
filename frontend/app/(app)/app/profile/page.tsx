"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LockKeyhole, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MeshGradient } from "@/components/decor/MeshGradient";
import { FadeIn } from "@/components/motion/FadeIn";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setMessage(null);
    setSubmitting(true);
    try {
      await updateProfile({ name, email });
      setMessage("Profile updated successfully.");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.errors) setFieldErrors(e.errors);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) return;
    setPasswordResetError(null);
    setPasswordResetSending(true);
    try {
      await authApi.forgotPassword({ email: user.email });
      setPasswordResetSent(true);
    } catch (e) {
      setPasswordResetError(
        e instanceof ApiError ? e.message : "Failed to send reset email. Try again.",
      );
    } finally {
      setPasswordResetSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm italic text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-sm md:p-10">
        <MeshGradient variant="teal" />
        <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: 1,
            }}
            transition={{
              scale: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              },
              opacity: { duration: 0.6 },
            }}
            className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25 backdrop-blur"
          >
            <span className="font-display text-3xl text-white">
              {user ? getInitials(user.name) : "—"}
            </span>
          </motion.div>
          <div className="flex flex-col gap-2">
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70"
            >
              Your account
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display text-4xl leading-tight tracking-tight text-white md:text-5xl"
            >
              {user?.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm text-teal-100"
            >
              {user?.email}
            </motion.p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.45 } },
              }}
              className="mt-1 flex flex-wrap gap-1.5"
            >
              {user?.roles.map((role) => (
                <motion.span
                  key={role}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur"
                >
                  {role}
                </motion.span>
              ))}
            </motion.div>
            {user?.created_at && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-3 text-xs italic text-teal-200"
              >
                Member since{" "}
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2 className="size-4" />
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <FadeIn>
          <Card className="border-slate-200">
            <CardHeader>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Editable details
              </p>
              <h2 className="font-display text-2xl tracking-tight text-slate-900">
                Personal details
              </h2>
              <p className="text-sm text-slate-500">
                Update your name and email address.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-slate-700">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="h-11"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-rose-600">{fieldErrors.name[0]}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-rose-600">{fieldErrors.email[0]}</p>
                    )}
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label className="text-slate-700">Role</Label>
                    <Input
                      type="text"
                      value={
                        user?.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") ??
                        ""
                      }
                      readOnly
                      className="h-11 bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 bg-teal-600 px-6 hover:bg-teal-500"
                    >
                      {submitting ? "Saving..." : "Save changes"}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LockKeyhole className="size-4 text-teal-600" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Security
                </p>
              </div>
              <h2 className="font-display text-2xl tracking-tight text-slate-900">
                Password
              </h2>
              <p className="text-sm text-slate-500">
                Send yourself a reset link when you need a new password.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <hr className="border-slate-100" />
              <p className="text-xs text-slate-400">
                We&apos;ll send a reset link to your registered email address.
              </p>

              <AnimatePresence mode="wait">
                {passwordResetSent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  >
                    Check your inbox — a password reset link has been sent to{" "}
                    <span className="font-medium">{user?.email}</span>.
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      disabled={passwordResetSending}
                      onClick={handlePasswordReset}
                      className="h-11 w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    >
                      {passwordResetSending ? "Sending..." : "Send password reset email"}
                    </Button>
                    {passwordResetError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                      >
                        {passwordResetError}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
