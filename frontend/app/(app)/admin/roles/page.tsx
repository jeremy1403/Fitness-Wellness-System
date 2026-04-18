"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { adminApi } from "@/lib/api/admin.api";
import { ApiError } from "@/lib/api/http";
import type { User, UserRole } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorialHero } from "@/components/decor/EditorialHero";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const allRoles: UserRole[] = ["admin", "trainer", "member"];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const filterOptions: { key: "all" | UserRole; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "trainer", label: "Trainer" },
  { key: "member", label: "Member" },
];

export default function AdminRolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [changeLoading, setChangeLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Unable to load role assignments right now."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered =
    filter === "all" ? users : users.filter((u) => u.roles.includes(filter));

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    if (user.roles.length === 1 && user.roles[0] === newRole) return;
    setChangeLoading(user.id);
    setActionError(null);
    try {
      const res = await adminApi.changeRole(user.id, user.roles, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
      setPulseId(user.id);
      setTimeout(() => setPulseId(null), 900);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to change the role for this user."),
      );
    } finally {
      setChangeLoading(null);
    }
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.roles.includes("admin")).length,
    trainer: users.filter((u) => u.roles.includes("trainer")).length,
    member: users.filter((u) => u.roles.includes("member")).length,
  };

  return (
    <div className="flex flex-col gap-8">
      <EditorialHero
        variant="amber"
        eyebrow="Role assignment"
        title={
          <>
            Who can do <em className="italic text-amber-100">what</em>
          </>
        }
        description="Three roles. Clear boundaries. Change them when your team evolves."
        compact
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          <Shield className="size-3.5" />
          {allRoles.length} system roles
        </span>
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
              onClick={() => fetchUsers()}
              disabled={loading}
              className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
            >
              {loading ? "Retrying..." : "Retry"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <FadeIn>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
          {filterOptions.map((opt) => {
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                className="relative rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {active && (
                  <motion.span
                    layoutId="roles-filter-indicator"
                    className="absolute inset-0 rounded-xl bg-amber-50 ring-1 ring-amber-200"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative ${active ? "text-amber-800" : ""}`}>
                  {opt.label}{" "}
                  <span className="text-xs text-slate-400">({roleCounts[opt.key]})</span>
                </span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : loadError && users.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <p className="text-sm text-slate-500">{loadError}</p>
                <Button type="button" variant="outline" onClick={() => fetchUsers()}>
                  Try again
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No users found with this role.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user, idx) => {
                    const isSelf = currentUser?.id === user.id;
                    const currentRole = user.roles[0] ?? "member";
                    const isPulsing = pulseId === user.id;

                    return (
                      <motion.tr
                        key={user.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          backgroundColor: isPulsing ? "rgb(254 243 199)" : "rgba(0,0,0,0)",
                        }}
                        transition={{
                          opacity: { duration: 0.3, delay: Math.min(idx, 12) * 0.04 },
                          y: { duration: 0.3, delay: Math.min(idx, 12) * 0.04 },
                          backgroundColor: { duration: 0.8, ease: "easeOut" },
                        }}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/60"
                      >
                        <TableCell className="font-medium text-slate-900">
                          {user.name}
                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs text-slate-400"
                            >
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500">{user.email}</TableCell>
                        <TableCell>
                          {isSelf ? (
                            <Badge variant="outline" className="text-xs capitalize">
                              {currentRole}
                            </Badge>
                          ) : (
                            <Select
                              value={currentRole}
                              onValueChange={(value) =>
                                handleChangeRole(user, value as UserRole)
                              }
                              disabled={changeLoading === user.id}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
