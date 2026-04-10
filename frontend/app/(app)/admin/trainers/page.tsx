"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { adminApi } from "@/lib/api/admin.api";
import { ApiError } from "@/lib/api/http";
import type { User } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function AdminTrainersPage() {
  const { user: currentUser } = useAuth();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const res = await adminApi.getUsers();
      setTrainers(res.data.filter((u) => u.roles.includes("trainer")));
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Unable to load trainers right now."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    setActionLoading(user.id);
    setActionError(null);
    try {
      const res = await adminApi.updateUserStatus(user.id, newStatus);
      setTrainers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to update the selected trainer."),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = trainers.filter((t) => t.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Trainers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage trainer accounts and availability.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Dumbbell className="h-4 w-4" />
            <span>
              {activeCount} active of {trainers.length}
            </span>
          </div>
        )}
      </div>

      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchTrainers()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {/* Trainer cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError && trainers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <p className="text-sm text-slate-500">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchTrainers()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : trainers.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-12 text-center text-sm text-slate-400">
            No trainers found. Assign the trainer role to users in the Roles
            page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => {
            const isSelf = currentUser?.id === trainer.id;

            return (
              <Card key={trainer.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                        {trainer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {trainer.name}
                        </p>
                        <Badge
                          variant={
                            trainer.status === "active"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            trainer.status === "active"
                              ? "mt-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "mt-1"
                          }
                        >
                          {trainer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{trainer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Joined {formatDate(trainer.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={isSelf || actionLoading === trainer.id}
                      onClick={() => toggleStatus(trainer)}
                    >
                      {isSelf
                        ? "Cannot modify yourself"
                        : actionLoading === trainer.id
                          ? "Updating..."
                          : trainer.status === "active"
                            ? "Disable trainer"
                            : "Enable trainer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
