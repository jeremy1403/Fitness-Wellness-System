"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Search,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ApiError, http } from "@/lib/api/http";
import type { Booking } from "@/types/booking";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminBooking extends Booking {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface AdminBookingsListResponse {
  data: AdminBooking[];
}

type SortKey = "member" | "class" | "schedule" | "status" | "booked_at";
type SortDir = "asc" | "desc" | null;

interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

const PAGE_SIZE = 10;

// ─── Admin Bookings API ───────────────────────────────────────────────────────

const adminBookingsApi = {
  getAll() {
    return http<AdminBookingsListResponse>("/admin/bookings", {
      cache: "no-store",
    });
  },
  cancel(id: number) {
    return http<{ message: string; data: AdminBooking }>(
      `/admin/bookings/${id}/cancel`,
      { method: "POST" }
    );
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function getSortValue(booking: AdminBooking, key: SortKey): string {
  switch (key) {
    case "member":
      return booking.user?.name?.toLowerCase() ?? "";
    case "class":
      return (
        booking.class_schedule?.fitness_class?.title?.toLowerCase() ?? ""
      );
    case "schedule":
      return booking.class_schedule?.start_datetime ?? "";
    case "status":
      return booking.status;
    case "booked_at":
      return booking.booked_at;
    default:
      return "";
  }
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc")
    return <ChevronUp className="h-3.5 w-3.5 text-slate-700" />;
  if (dir === "desc")
    return <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
}

// ─── Sortable Header ──────────────────────────────────────────────────────────

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sort.key === sortKey;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-slate-900 ${
          isActive ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {label}
        <SortIcon dir={isActive ? sort.dir : null} />
      </button>
    </TableHead>
  );
}

// ─── Stat cards config ────────────────────────────────────────────────────────

const statCards = [
  {
    key: "total" as const,
    label: "Total Bookings",
    icon: CalendarDays,
    color: "text-slate-600",
  },
  {
    key: "booked" as const,
    label: "Active",
    icon: CheckCircle,
    color: "text-emerald-600",
  },
  {
    key: "cancelled" as const,
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: null, dir: null });
  const [page, setPage] = useState(1);
  

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const res = await adminBookingsApi.getAll();
      setBookings(res.data);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Unable to load bookings right now.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (booking: AdminBooking) => {
    setActionLoading(booking.id);
    setActionError(null);
    try {
      const res = await adminBookingsApi.cancel(booking.id);
      setBookings((prev) =>
        prev.map((b) => (b.id === res.data.id ? { ...b, ...res.data } : b))
      );
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to cancel this booking.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Cycle: null → asc → desc → null
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
    setPage(1);
  }, []);

  const stats = {
    total: bookings.length,
    booked: bookings.filter((b) => b.status === "booked").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b.class_schedule?.fitness_class?.title?.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  // Sort
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sort.key!);
      const bv = getSortValue(b, sort.key!);
      const cmp = av.localeCompare(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview and management of all class bookings.
        </p>
      </div>

      {/* Error banner */}
      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchData}
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
                {loading ? (
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
          {/* Search bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by user or class name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 p-0 shadow-none focus-visible:ring-0"
            />
            {!loading && (
              <span className="shrink-0 text-xs text-slate-400">
                {sorted.length} result{sorted.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : loadError && bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <p className="text-sm text-slate-500">{loadError}</p>
              <Button type="button" variant="outline" onClick={fetchData}>
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              {search
                ? "No bookings match your search."
                : "No bookings found."}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="Member"
                      sortKey="member"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Class"
                      sortKey="class"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Schedule"
                      sortKey="schedule"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Status"
                      sortKey="status"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Booked At"
                      sortKey="booked_at"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {booking.user?.name ?? "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {booking.user?.email ?? ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {booking.class_schedule?.fitness_class?.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {booking.class_schedule?.start_datetime
                          ? formatDateTime(
                              booking.class_schedule.start_datetime
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "booked"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            booking.status === "booked"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : ""
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(booking.booked_at)}
                      </TableCell>
                      <TableCell>
                        {booking.status === "booked" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoading === booking.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCancel(booking)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Cancel booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled
                          >
                            <MoreHorizontal className="h-4 w-4 opacity-30" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-400">
                    Showing{" "}
                    <span className="font-medium text-slate-600">
                      {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, sorted.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-600">
                      {sorted.length}
                    </span>{" "}
                    bookings
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}