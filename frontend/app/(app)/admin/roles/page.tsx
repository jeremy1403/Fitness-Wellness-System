"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Plus, X } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Assign role dialog state
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Remove role dialog state
  const [removeTarget, setRemoveTarget] = useState<{
    user: User;
    role: string;
  } | null>(null);

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

  const handleAssignRole = async () => {
    if (!assignTarget || !selectedRole) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.assignRole(assignTarget.id, selectedRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
      setAssignTarget(null);
      setSelectedRole("");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to assign the selected role."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.removeRole(
        removeTarget.user.id,
        removeTarget.role,
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === res.data.id ? res.data : u)),
      );
      setRemoveTarget(null);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to remove the selected role."),
      );
    } finally {
      setActionLoading(false);
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
            View and manage user role assignments.
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
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const availableRoles = allRoles.filter(
                    (r) => !user.roles.includes(r),
                  );

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-slate-900">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className="group gap-1 pr-1 text-xs"
                            >
                              {role}
                              <button
                                type="button"
                                onClick={() =>
                                  setRemoveTarget({ user, role })
                                }
                                className="ml-0.5 rounded-sm p-0.5 opacity-50 transition hover:bg-slate-200 hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {availableRoles.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => {
                              setAssignTarget(user);
                              setSelectedRole("");
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Assign
                          </Button>
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

      {/* Assign role dialog */}
      <Dialog
        open={!!assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign role</DialogTitle>
            <DialogDescription>
              Add a role to <strong>{assignTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {assignTarget &&
                allRoles
                  .filter((r) => !assignTarget.roles.includes(r))
                  .map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignTarget(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedRole || actionLoading}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {actionLoading ? "Assigning..." : "Assign role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove role confirmation */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove role</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the <strong>{removeTarget?.role}</strong> role from{" "}
              <strong>{removeTarget?.user.name}</strong>? This action can be
              undone by re-assigning the role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-500"
            >
              {actionLoading ? "Removing..." : "Remove role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
