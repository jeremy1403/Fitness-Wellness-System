"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
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

export default function AdminSettingsPage() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string[]>>({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileFieldErrors({});
    setProfileSuccess(false);
    setProfileSubmitting(true);
    try {
      await updateProfile({ name, email });
      setProfileSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(err.message);
        if (err.errors) setProfileFieldErrors(err.errors);
      } else {
        setProfileError("An unexpected error occurred.");
      }
    } finally {
      setProfileSubmitting(false);
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

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-sm md:p-10">
        <MeshGradient variant="amber" />
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
              Admin profile
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
              className="text-sm text-amber-100"
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
                className="mt-3 text-xs italic text-amber-200"
              >
                Admin since{" "}
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <FadeIn>
          <Card className="border-slate-200">
            <CardHeader>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Editable details
              </p>
              <h2 className="font-display text-2xl tracking-tight text-slate-900">
                Profile
              </h2>
              <p className="text-sm text-slate-500">
                Update your display name and email.
              </p>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  >
                    {profileError}
                  </motion.div>
                )}
                {profileSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  >
                    <CheckCircle2 className="size-4" />
                    Profile updated successfully.
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleProfileSubmit} className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-slate-700">
                      Display name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Admin name"
                      required
                      className="h-11"
                    />
                    {profileFieldErrors.name && (
                      <p className="text-xs text-rose-600">{profileFieldErrors.name[0]}</p>
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
                      placeholder="admin@example.com"
                      required
                      className="h-11"
                    />
                    {profileFieldErrors.email && (
                      <p className="text-xs text-rose-600">{profileFieldErrors.email[0]}</p>
                    )}
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label className="text-slate-700">Roles</Label>
                    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      {user?.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={profileSubmitting}
                      className="h-11 bg-amber-600 px-6 hover:bg-amber-500"
                    >
                      {profileSubmitting ? "Saving..." : "Save profile"}
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
                <ShieldCheck className="size-4 text-amber-600" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Security
                </p>
              </div>
              <h2 className="font-display text-2xl tracking-tight text-slate-900">
                Password
              </h2>
              <p className="text-sm text-slate-500">
                Manage your account password and recovery.
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
                      className="h-11 w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
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
