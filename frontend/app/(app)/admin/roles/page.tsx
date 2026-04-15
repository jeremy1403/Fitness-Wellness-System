"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { adminApi } from "@/lib/api/admin.api";
import { ApiError } from "@/lib/api/http";
import type { User, UserRole } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const allRoles: UserRole[] = ["admin", "trainer", "member"];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function AdminRolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [changeLoading, setChangeLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    filter === "all"
      ? users
      : users.filter((u) => u.roles.includes(filter));

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    if (user.roles.length === 1 && user.roles[0] === newRole) return;
    setChangeLoading(user.id);
    setActionError(null);
    try {
      const res = await adminApi.changeRole(user.id, user.roles, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Roles</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage user roles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Shield className="h-4 w-4" />
          <span>
            {allRoles.length} system roles
          </span>
        </div>
      </div>

      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchUsers()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | UserRole)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({roleCounts.all})</TabsTrigger>
          <TabsTrigger value="admin">Admin ({roleCounts.admin})</TabsTrigger>
          <TabsTrigger value="trainer">
            Trainer ({roleCounts.trainer})
          </TabsTrigger>
          <TabsTrigger value="member">Member ({roleCounts.member})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchUsers()}
              >
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
                {filtered.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const currentRole = user.roles[0] ?? "member";

                  return (
                    <TableRow key={user.id}>
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
                      <TableCell className="text-slate-500">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Badge variant="outline" className="text-xs">
                            {currentRole.charAt(0).toUpperCase() +
                              currentRole.slice(1)}
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
