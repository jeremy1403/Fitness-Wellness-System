"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const { user, updateProfile } = useAuth();

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password form
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordFieldErrors({});
    setPasswordSuccess(false);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const passwordConfirmation = form.get("password_confirmation") as string;

    if (password !== passwordConfirmation) {
      setPasswordFieldErrors({
        password_confirmation: ["Passwords do not match."],
      });
      return;
    }

    setPasswordSubmitting(true);
    try {
      await updateProfile({ password, password_confirmation: passwordConfirmation });
      setPasswordSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
        if (err.errors) setPasswordFieldErrors(err.errors);
      } else {
        setPasswordError("An unexpected error occurred.");
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Admin Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your admin profile and security preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">
              Update your display name and email.
            </p>
          </CardHeader>
          <CardContent>
            {profileError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Profile updated successfully.
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin name"
                  required
                  className="h-11"
                />
                {profileFieldErrors.name && (
                  <p className="text-xs text-red-600">
                    {profileFieldErrors.name[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
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
                  <p className="text-xs text-red-600">
                    {profileFieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-1.5">
                  {user?.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={profileSubmitting}
                className="mt-2 bg-amber-600 hover:bg-amber-500"
              >
                {profileSubmitting ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password section */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Change Password
            </h2>
            <p className="text-sm text-slate-500">
              Update your account password.
            </p>
          </CardHeader>
          <CardContent>
            {passwordError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Password changed successfully.
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
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
                {passwordFieldErrors.password && (
                  <p className="text-xs text-red-600">
                    {passwordFieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
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
                {passwordFieldErrors.password_confirmation && (
                  <p className="text-xs text-red-600">
                    {passwordFieldErrors.password_confirmation[0]}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordSubmitting}
                className="mt-2 bg-amber-600 hover:bg-amber-500"
              >
                {passwordSubmitting ? "Updating..." : "Change password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
