"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, UserCheck, UserX, MoreHorizontal, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";
import { adminApi } from "@/lib/api/admin.api";
import type { User } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorialHero } from "@/components/decor/EditorialHero";
import { CountUp } from "@/components/motion/CountUp";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statCards = [
  {
    key: "total" as const,
    label: "Total users",
    icon: Users,
    accent: "from-slate-200 to-slate-400",
    iconClass: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    key: "active" as const,
    label: "Active",
    icon: UserCheck,
    accent: "from-emerald-300 to-emerald-500",
    iconClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    key: "disabled" as const,
    label: "Disabled",
    icon: UserX,
    accent: "from-rose-300 to-rose-500",
    iconClass: "bg-rose-50 text-rose-700 ring-rose-100",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ active: number; disabled: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getUserStats(),
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Unable to load users right now."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    setActionLoading(user.id);
    setActionError(null);
    try {
      const res = await adminApi.updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
      setStats((prev) =>
        prev
          ? {
              ...prev,
              active: prev.active + (newStatus === "active" ? 1 : -1),
              disabled: prev.disabled + (newStatus === "disabled" ? 1 : -1),
            }
          : prev,
      );
      setPulseId(user.id);
      setTimeout(() => setPulseId(null), 900);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to update the selected user."),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-8">
      <EditorialHero
        variant="amber"
        eyebrow="Access control"
        title={
          <>
            The <em className="italic text-amber-100">people</em> on your platform
          </>
        }
        description="Every member, trainer, and admin — with the levers to manage access."
        compact
      />

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
              onClick={() => fetchData()}
              disabled={loading}
              className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
            >
              {loading ? "Retrying..." : "Retry"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map(({ key, label, icon: Icon, accent, iconClass }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <div className={`h-0.75 w-full bg-linear-to-r ${accent}`} />
              <div className="flex items-center gap-5 p-6">
                <div className={`rounded-2xl p-3 ring-1 ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {label}
                  </p>
                  {loading || !stats ? (
                    <Skeleton className="mt-2 h-10 w-16" />
                  ) : (
                    <p className="mt-2 font-display text-4xl leading-none tracking-tight text-slate-900">
                      <CountUp to={stats[key]} />
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-0">
            <div className="relative flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-0 p-0 shadow-none focus-visible:ring-0"
              />
              {search && (
                <span className="text-xs text-slate-400">
                  {filtered.length} match{filtered.length === 1 ? "" : "es"}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : loadError && users.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <p className="text-sm text-slate-500">{loadError}</p>
                <Button type="button" variant="outline" onClick={() => fetchData()}>
                  Try again
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                {search ? "No users match your search." : "No users found."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user, idx) => {
                    const isSelf = currentUser?.id === user.id;
                    const isPulsing = pulseId === user.id;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          backgroundColor: isPulsing ? "rgb(254 243 199)" : "rgba(0,0,0,0)",
                        }}
                        transition={{
                          opacity: { duration: 0.3, delay: Math.min(idx, 12) * 0.03 },
                          y: { duration: 0.3, delay: Math.min(idx, 12) * 0.03 },
                          backgroundColor: { duration: 0.8, ease: "easeOut" },
                        }}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/60"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-slate-500">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === "active" ? "default" : "destructive"}
                            className={
                              user.status === "active"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : ""
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs capitalize">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          {isSelf ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                You cannot modify your own account
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={actionLoading === user.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleStatus(user)}>
                                  {user.status === "active" ? "Disable user" : "Enable user"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
