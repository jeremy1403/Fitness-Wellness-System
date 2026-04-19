"use client";

import { useCallback, useEffect, useState } from "react";
import { bookingsApi } from "@/lib/api/bookings.api";
import { ApiError } from "@/lib/api/http";
import type { Booking } from "@/types/booking";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const styles: Record<string, string> = {
    booked:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    attended:  "bg-blue-50 text-blue-700 border-blue-200",
    no_show:   "bg-amber-50 text-amber-700 border-amber-200",
  };

  const dotStyles: Record<string, string> = {
    booked:    "bg-emerald-500",
    cancelled: "bg-slate-400",
    attended:  "bg-blue-500",
    no_show:   "bg-amber-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status] ?? styles.cancelled}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] ?? dotStyles.cancelled}`} />
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-700">No bookings yet</p>
      <p className="mt-1 text-sm text-slate-400">
        Head to Classes to browse and book a session.
      </p>
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const schedule = booking.class_schedule;
  const fitnessClass = schedule?.fitness_class;
  const isBooked = booking.status === "booked";

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
        !isBooked ? "opacity-60" : "border-slate-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="truncate text-lg font-bold text-slate-900">
            {fitnessClass?.title ?? "Fitness Class"}
          </p>
          {fitnessClass?.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
              {fitnessClass.description}
            </p>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Schedule info */}
      {schedule && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Date
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatDate(schedule.start_datetime)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Time
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatTime(schedule.start_datetime)} –{" "}
              {formatTime(schedule.end_datetime)}
            </p>
          </div>
          {fitnessClass?.duration_minutes && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Duration
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {fitnessClass.duration_minutes} min
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Booked {formatDate(booking.booked_at)}
        </p>
        {isBooked && (
          <button
            onClick={() => onCancel(booking.id)}
            disabled={cancelling}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel Booking"}
          </button>
        )}
        {!isBooked && booking.cancelled_at && (
          <p className="text-xs text-slate-400">
            Cancelled {formatDate(booking.cancelled_at)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "booked" | "cancelled";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingsApi.history();
      setBookings(res.data);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load bookings. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to cancel this booking?")) return;
      try {
        setCancellingId(id);
        await bookingsApi.cancel(id);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "cancelled", cancelled_at: new Date().toISOString() }
              : b,
          ),
        );
      } catch (e) {
        if (e instanceof ApiError) {
          alert(e.message);
        } else {
          alert("Failed to cancel booking. Please try again.");
        }
      } finally {
        setCancellingId(null);
      }
    },
    [],
  );

  const filtered = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter,
  );

  const activeCount = bookings.filter((b) => b.status === "booked").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your upcoming and past class sessions.
            </p>
          </div>
          {/* Summary pills */}
          {!loading && bookings.length > 0 && (
            <div className="flex gap-2 mt-3 sm:mt-0">
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                {activeCount} Active
              </span>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                {cancelledCount} Cancelled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {!loading && bookings.length > 0 && (
        <div className="flex gap-2">
          {(["all", "booked", "cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              onClick={loadBookings}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancellingId === booking.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}