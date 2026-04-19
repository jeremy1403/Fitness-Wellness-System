"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { AuthHeroPanel } from "@/components/decor/AuthHeroPanel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthHeroPanel
        tone="teal"
        quote="Recovery is part of the practice."
        footer="Secure · Reliable · Modern"
      />

      <div className="flex items-center justify-center bg-slate-50 p-6 lg:bg-white lg:p-12">
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
                className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"
              >
                <KeyRound className="size-5" />
              </motion.div>
              <span className="inline-flex items-center self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                Password reset
              </span>
              <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900">
                Forgot your <em className="italic text-teal-700">password</em>?
              </h1>
              <p className="text-sm text-slate-500">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 16 }}
                    >
                      <CheckCircle2 className="size-12 text-emerald-500" />
                    </motion.div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Reset link sent!
                    </p>
                    <p className="text-sm text-emerald-700">
                      If that email is registered, a reset link has been sent. Please
                      check your inbox.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                        <Label htmlFor="email" className="text-slate-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          autoComplete="email"
                          placeholder="your@email.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="mt-1 h-11 w-full bg-teal-600 font-semibold hover:bg-teal-500"
                        >
                          {submitting ? "Sending..." : "Send reset email"}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
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
      </div>
    </div>
  );
}
