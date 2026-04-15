"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserCheck, UserX, MoreHorizontal, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/http";
import {
  adminApi,
} from "@/lib/api/admin.api";
import type { User } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  { key: "total" as const, label: "Total Users", icon: Users, color: "text-slate-600" },
  { key: "active" as const, label: "Active", icon: UserCheck, color: "text-emerald-600" },
  { key: "disabled" as const, label: "Disabled", icon: UserX, color: "text-red-500" },
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
      // update stats locally
      setStats((prev) =>
        prev
          ? {
              ...prev,
              active: prev.active + (newStatus === "active" ? 1 : -1),
              disabled: prev.disabled + (newStatus === "disabled" ? 1 : -1),
            }
          : prev,
      );
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage user accounts and status.
        </p>
      </div>

      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-slate-100 p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                {loading || !stats ? (
                  <Skeleton className="mt-1 h-7 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats[key]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 p-0 shadow-none focus-visible:ring-0"
            />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchData()}
              >
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
                {filtered.map((user) => {
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-slate-900">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "destructive"
                          }
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
                            <Badge key={role} variant="outline" className="text-xs">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled
                              >
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
                              <DropdownMenuItem
                                onClick={() => toggleStatus(user)}
                              >
                                {user.status === "active"
                                  ? "Disable user"
                                  : "Enable user"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
