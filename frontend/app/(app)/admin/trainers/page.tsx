"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { EditorialHero } from "@/components/decor/EditorialHero";
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
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatScheduleTime(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Time TBA";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
        getSchedules<ClassSchedule>(),
      ]);
      setTrainers(usersRes.data.filter((u) => u.roles.includes("trainer")));
      setSchedules(schedulesRes);
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
    <div className="flex flex-col gap-8">
      <EditorialHero
        variant="amber"
        eyebrow="Studio roster"
        title={
          <>
            The people who run the <em className="italic text-amber-100">room</em>
          </>
        }
        description="Your trainers, their upcoming classes, and who's active on the floor."
        compact
      >
        {!loading && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Dumbbell className="size-3.5" />
            {activeCount} active of {trainers.length}
          </span>
        )}
      </EditorialHero>

      <AnimatePresence>
        {(loadError || actionError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{actionError ?? loadError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchTrainers()}
              disabled={loading}
              className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
            >
              {loading ? "Retrying..." : "Retry"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : loadError && trainers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <p className="text-sm text-slate-500">{loadError}</p>
            <Button type="button" variant="outline" onClick={() => fetchTrainers()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : trainers.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-12 text-center text-sm text-slate-400">
            No trainers found. Assign the trainer role to users in the Roles page.
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {trainers.map((trainer) => {
            const isSelf = currentUser?.id === trainer.id;
            const trainerSchedules =
              schedulesByTrainerUserId.get(trainer.id) ?? [];
            const nextSchedule = trainerSchedules[0];
            const scheduleCountLabel = `${trainerSchedules.length} upcoming ${
              trainerSchedules.length === 1 ? "schedule" : "schedules"
            }`;

            return (
              <motion.div
                key={trainer.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{ y: -4 }}
                transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-linear-to-br from-amber-100/60 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: -3 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 font-display text-lg font-semibold text-amber-700 ring-1 ring-amber-100"
                    >
                      {trainer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl leading-tight tracking-tight text-slate-900">
                        {trainer.name}
                      </p>
                      <Badge
                        variant={trainer.status === "active" ? "default" : "destructive"}
                        className={
                          trainer.status === "active"
                            ? "mt-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "mt-1.5"
                        }
                      >
                        {trainer.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{trainer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Joined {formatDate(trainer.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Next schedule
                      </p>
                      <Badge variant="outline" className="text-[11px]">
                        {trainerSchedules.length}
                      </Badge>
                    </div>

                    {!nextSchedule ? (
                      <p className="mt-3 rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm italic text-slate-400">
                        No upcoming schedules.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-1 font-medium text-slate-900">
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
                              {formatScheduleDate(nextSchedule.start_datetime)}
                            </span>
                            <span>
                              {formatScheduleTime(nextSchedule.start_datetime)} -{" "}
                              {formatScheduleTime(nextSchedule.end_datetime)}
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
                              <DialogTitle className="font-display text-2xl tracking-tight">
                                {trainer.name}
                                <span className="ml-2 text-base italic text-slate-400">
                                  schedules
                                </span>
                              </DialogTitle>
                              <DialogDescription>
                                {scheduleCountLabel}
                              </DialogDescription>
                            </DialogHeader>

                            <motion.div
                              variants={{
                                hidden: {},
                                show: { transition: { staggerChildren: 0.05 } },
                              }}
                              initial="hidden"
                              animate="show"
                              className="divide-y divide-slate-100"
                            >
                              {trainerSchedules.map((schedule) => (
                                <motion.div
                                  key={schedule.id}
                                  variants={{
                                    hidden: { opacity: 0, y: 8 },
                                    show: { opacity: 1, y: 0 },
                                  }}
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
                                      {formatScheduleDate(schedule.start_datetime)}
                                    </span>
                                    <span>
                                      {formatScheduleTime(schedule.start_datetime)} -{" "}
                                      {formatScheduleTime(schedule.end_datetime)}
                                    </span>
                                    <span>{schedule.capacity} spots</span>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
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
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
