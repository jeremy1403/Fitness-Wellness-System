"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { adminApi } from "@/lib/api/admin.api";
import { getSchedules } from "@/lib/api/schedules.api";
import { ApiError } from "@/lib/api/http";
import type { User } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScheduleFitnessClass {
  id?: number;
  title?: string | null;
  status?: string | null;
}

interface ScheduleTrainerUser {
  id?: number;
  name?: string | null;
  email?: string | null;
}

interface ScheduleTrainer {
  id?: number;
  user?: ScheduleTrainerUser | null;
}

interface ClassSchedule {
  id: number;
  fitness_class?: ScheduleFitnessClass | null;
  trainer?: ScheduleTrainer | null;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  status?: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScheduleDate(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "Date TBA";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatScheduleTime(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "Time TBA";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSchedulesResponse(value: unknown): ClassSchedule[] {
  if (Array.isArray(value)) {
    return value as ClassSchedule[];
  }

  if (typeof value === "object" && value !== null && "data" in value) {
    const data = (value as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as ClassSchedule[];
    }
  }

  throw new Error("Invalid schedules response received from backend.");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function AdminTrainersPage() {
  const { user: currentUser } = useAuth();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [usersRes, schedulesRes] = await Promise.all([
        adminApi.getUsers(),
        getSchedules(),
      ]);

      setTrainers(usersRes.data.filter((u) => u.roles.includes("trainer")));
      setSchedules(normalizeSchedulesResponse(schedulesRes));
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
  const schedulesByTrainerUserId = useMemo(() => {
    const grouped = new Map<number, ClassSchedule[]>();
    const now = Date.now();

    for (const schedule of schedules) {
      const trainerUserId = schedule.trainer?.user?.id;
      const startTime = new Date(schedule.start_datetime).getTime();

      if (
        typeof trainerUserId !== "number" ||
        Number.isNaN(startTime) ||
        startTime < now
      ) {
        continue;
      }

      const trainerSchedules = grouped.get(trainerUserId) ?? [];
      trainerSchedules.push(schedule);
      grouped.set(trainerUserId, trainerSchedules);
    }

    for (const trainerSchedules of grouped.values()) {
      trainerSchedules.sort(
        (a, b) =>
          new Date(a.start_datetime).getTime() -
          new Date(b.start_datetime).getTime(),
      );
    }

    return grouped;
  }, [schedules]);

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
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
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
            const trainerSchedules =
              schedulesByTrainerUserId.get(trainer.id) ?? [];
            const nextSchedule = trainerSchedules[0];
            const scheduleCountLabel = `${trainerSchedules.length} upcoming ${
              trainerSchedules.length === 1 ? "schedule" : "schedules"
            }`;

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
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Next schedule
                      </p>
                      <Badge variant="outline" className="text-[11px]">
                        {trainerSchedules.length}
                      </Badge>
                    </div>

                    {!nextSchedule ? (
                      <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-400">
                        No upcoming schedules.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-1 text-sm font-medium text-slate-900">
                              {nextSchedule.fitness_class?.title ??
                                "Untitled class"}
                            </p>
                            {nextSchedule.status && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px]"
                              >
                                {nextSchedule.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              {formatScheduleDate(
                                nextSchedule.start_datetime,
                              )}
                            </span>
                            <span>
                              {formatScheduleTime(
                                nextSchedule.start_datetime,
                              )}{" "}
                              - {formatScheduleTime(nextSchedule.end_datetime)}
                            </span>
                            <span>{nextSchedule.capacity} spots</span>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                            >
                              View all schedules ({trainerSchedules.length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {trainer.name} schedules
                              </DialogTitle>
                              <DialogDescription>
                                {scheduleCountLabel}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="divide-y divide-slate-100">
                              {trainerSchedules.map((schedule) => (
                                <div
                                  key={schedule.id}
                                  className="py-3 first:pt-0 last:pb-0"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="font-medium text-slate-900">
                                      {schedule.fitness_class?.title ??
                                        "Untitled class"}
                                    </p>
                                    {schedule.status && (
                                      <Badge
                                        variant="outline"
                                        className="shrink-0 text-[10px]"
                                      >
                                        {schedule.status}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                    <span>
                                      {formatScheduleDate(
                                        schedule.start_datetime,
                                      )}
                                    </span>
                                    <span>
                                      {formatScheduleTime(
                                        schedule.start_datetime,
                                      )}{" "}
                                      -{" "}
                                      {formatScheduleTime(
                                        schedule.end_datetime,
                                      )}
                                    </span>
                                    <span>{schedule.capacity} spots</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
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
