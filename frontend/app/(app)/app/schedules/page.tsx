"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // 用于获取 URL 上的 classId
import { useAuth } from "@/lib/auth/context"; 
import { getFitnessClasses } from "@/lib/api/classes.api";
import { 
  createSchedule, 
  getSchedules, 
  deleteSchedule, 
  getTrainers,
  updateSchedule 
} from "@/lib/api/schedules.api"; 
import { ScheduleStrategyFactory } from "@/lib/strategies/schedule.strategies"; 
import { bookingsApi } from "@/lib/api/bookings.api";
import { ApiError } from "@/lib/api/http";
import type { Booking } from "@/types/booking";

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error";

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-lg text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// ─── Attendance Badge ─────────────────────────────────────────────────────────

function AttendanceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    booked:    "bg-blue-50 text-blue-700 border-blue-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    attended:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    no_show:   "bg-amber-50 text-amber-700 border-amber-200",
  };

  const labels: Record<string, string> = {
    booked:    "Booked",
    cancelled: "Cancelled",
    attended:  "Attended",
    no_show:   "No Show",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-500 border-slate-200"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Attendance Panel ─────────────────────────────────────────────────────────

function AttendancePanel({
  scheduleId,
  onToast,
}: {
  scheduleId: number;
  onToast: (message: string, type: ToastType) => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    bookingsApi
      .getScheduleBookings(scheduleId)
      .then((res) => setBookings(res.data))
      .catch(() => onToast("Failed to load bookings.", "error"))
      .finally(() => setLoading(false));
  }, [scheduleId, onToast]);

  const handleAttendance = async (
    bookingId: number,
    status: "attended" | "no_show"
  ) => {
    setUpdatingId(bookingId);
    try {
      const res = await bookingsApi.updateAttendance(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: res.data.status } : b))
      );
      onToast(
        status === "attended" ? "Marked as attended." : "Marked as no-show.",
        "success"
      );
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Failed to update attendance.";
      onToast(message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center py-4">Loading attendees…</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center py-4">No bookings for this session yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Attendees ({bookings.length})
      </p>
      <div className="flex flex-col gap-2">
        {bookings.map((booking) => {
          const isUpdating = updatingId === booking.id;
          const canMark =
            booking.status === "booked" ||
            booking.status === "attended" ||
            booking.status === "no_show";

          return (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 uppercase">
                  {booking.user?.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {booking.user?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {booking.user?.email ?? ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AttendanceBadge status={booking.status} />
                {canMark && booking.status !== "cancelled" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAttendance(booking.id, "attended")}
                      disabled={isUpdating || booking.status === "attended"}
                      title="Mark attended"
                      className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ✓ Attended
                    </button>
                    <button
                      onClick={() => handleAttendance(booking.id, "no_show")}
                      disabled={isUpdating || booking.status === "no_show"}
                      title="Mark no-show"
                      className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ✗ No Show
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Book Now Button ──────────────────────────────────────────────────────────

function BookNowButton({ scheduleId }: { scheduleId: number }) {
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleBook = async () => {
    setBooking(true);
    try {
      await bookingsApi.create({ class_schedule_id: scheduleId });
      setToast({ message: "Booking confirmed! View it in My Bookings.", type: "success" });
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Booking failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      <button
        onClick={handleBook}
        disabled={booking}
        className="mt-4 sm:mt-0 w-full sm:w-auto text-center rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {booking ? "Booking…" : "Book Now"}
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// --- 核心内容组件 ---
function SchedulesContent() {
  const { primaryRole, user } = useAuth(); 
  const searchParams = useSearchParams();
  const filterClassId = searchParams.get("classId"); // 获取从 Class 页面传来的参数

  const [classes, setClasses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheduleId, setExpandedScheduleId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form Status
  const [classId, setClassId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(20);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 1. Initialize data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classesData, trainersData, schedulesData] = await Promise.all([
        getFitnessClasses(),
        getTrainers(),
        getSchedules()
      ]);
      
      // 修复 TypeScript 'data' 报错
      setClasses(Array.isArray(classesData) ? classesData : (classesData as any)?.data || []);
      setTrainers(Array.isArray(trainersData) ? trainersData : (trainersData as any)?.data || []);
      setScheduleList(Array.isArray(schedulesData) ? schedulesData : (schedulesData as any)?.data || []);

    } catch (err) {
      setError("Could not load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (primaryRole === 'trainer' && user && trainers.length > 0) {
      const myTrainerProfile = trainers.find((t: any) => t.name === user.name);
      if (myTrainerProfile) {
        setTrainerId(String(myTrainerProfile.id)); 
      }
    }
  }, [user, primaryRole, trainers]);
  
  // 2. Automation strategy: Calculate end time
  useEffect(() => {
    const selectedClass = classes.find(c => String(c.id) === String(classId));
    if (selectedClass && startTime) {
      const mode = selectedClass.setup_mode || "automated";
      const duration = selectedClass.duration_minutes || 60;
      const strategy = ScheduleStrategyFactory.make(mode);
      const calculatedEnd = strategy.calculateEndTime(startTime, duration);
      if (calculatedEnd) setEndTime(calculatedEnd);
    }
  }, [classId, startTime, classes]);

  const formatToInput = (str: string) => {
    if (!str) return "";
    const d = new Date(str);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- Management functions ---
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setClassId(String(item.fitness_class_id));
    setTrainerId(String(item.trainer_id));
    setCapacity(item.capacity);
    setStartTime(formatToInput(item.start_datetime));
    setEndTime(formatToInput(item.end_datetime));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setClassId("");
    if (primaryRole !== 'trainer') setTrainerId("");
    setStartTime("");
    setEndTime("");
    setCapacity(20);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        fitness_class_id: classId,
        trainer_id: trainerId,
        start_datetime: startTime.replace("T", " "),
        end_datetime: endTime.replace("T", " "),
        capacity: capacity,
      };

      if (editingId) {
        await updateSchedule(editingId, payload);
      } else {
        await createSchedule(payload);
      }
      cancelEdit();
      await loadInitialData();
    } catch (e: any) {
      setError(e.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteSchedule(id);
      setScheduleList(prev => prev.filter(s => s.id !== id));
    } catch (err) { alert("Delete failed."); }
  };

<<<<<<< HEAD
  // --- 重点：数据过滤与排序 ---
  const now = new Date().getTime();
  const displaySchedules = scheduleList
    .filter((item) => {
      // 1. 如果课程未激活，不显示
      if (item.fitness_class?.status !== 'active') return false;
      
      // 2. 过滤掉过去的排期（只显示未来）
      if (new Date(item.start_datetime).getTime() < now) return false;

      // 3. 如果 URL 里有 classId，只显示对应课程的排期
      if (filterClassId && String(item.fitness_class_id) !== filterClassId) {
        return false;
      }

      // 4. 【新增逻辑】：如果是 Trainer，只显示分配给自己的排期
      if (primaryRole === 'trainer') {
        const myTrainerProfile = trainers.find(t => t.name === user?.name);
        // 如果这节课的教练ID，不是当前登录教练的ID，就隐藏掉
        if (myTrainerProfile && String(item.trainer_id) !== String(myTrainerProfile.id)) {
          return false; 
        }
      }
      
      return true;
    })
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()); // 按时间升序排序

=======
  const toggleExpand = (id: number) => {
    setExpandedScheduleId((prev) => (prev === id ? null : id));
  };
>>>>>>> 2da4572 (feat(booking): implement booking module with State Pattern, attendance marking, admin oversight and BookingResource)

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4">
      {/* Global toast for attendance actions */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {primaryRole === 'trainer' ? (editingId ? " Edit Schedule" : " Manage Schedules") : "Upcoming Sessions"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
<<<<<<< HEAD
            {primaryRole === 'trainer' ? "Assign classes to time slots." : filterClassId ? "Showing available times for selected class." : "Find a time that works and book your spot."}
=======
            {primaryRole === 'trainer' ? "Manage your sessions and mark attendance." : "Find a time that works and book your spot."}
>>>>>>> 2da4572 (feat(booking): implement booking module with State Pattern, attendance marking, admin oversight and BookingResource)
          </p>
        </div>
        <Link href="/app/classes" className="text-sm font-medium text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
          ← Back to Classes
        </Link>
      </div>

      {/* Trainer Form (Only visible to trainers) */}
      {primaryRole === "trainer" && (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-500">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {error && <div className="sm:col-span-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

              <label className="text-sm font-medium sm:col-span-2 text-slate-700">
                Select Class
                <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white outline-none">
                  <option value="" disabled>Choose a fitness class...</option>
                  {classes
                    .filter(c => c.status === 'active' && (c.created_by === user?.id || c.created_by === 1)) 
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))
                  }
                </select>
              </label>
<<<<<<< HEAD
              
=======

>>>>>>> 2da4572 (feat(booking): implement booking module with State Pattern, attendance marking, admin oversight and BookingResource)
              <label className="text-sm font-medium sm:col-span-2 text-slate-700">
                Assign Trainer
                <div className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user?.name}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">ME</span>
                  </div>
                  {!trainerId && <span className="text-[10px] text-red-500 font-bold">ID NOT FOUND!</span>}
                </div>
                <input type="hidden" value={trainerId} />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Start Time
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" />
              </label>

              <label className="text-sm font-medium text-slate-700">
                End Time (Auto-calculated)
                <input type="datetime-local" value={endTime} readOnly className="mt-2 w-full rounded-2xl border px-4 py-3 bg-slate-50 outline-none" />
              </label>

              <label className="text-sm font-medium sm:col-span-2 text-slate-700">
                Max Capacity
                <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} min="1" required className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none" />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Actions</h2>
              <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-blue-700 mt-1">Ready to {editingId ? "Update" : "Publish"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              <button type="submit" disabled={submitting} className={`w-full rounded-full py-4 font-bold text-white transition-all shadow-md ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                {submitting ? "Processing..." : editingId ? "Update Schedule" : "Publish Schedule"}
              </button>
              {editingId && (
                <button onClick={cancelEdit} type="button" className="text-sm text-slate-400 hover:text-slate-900 transition-colors py-2">
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        </form>
      )}

      {/* --- Schedule List (已应用过滤和排序) --- */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading schedules...</div>
        ) : displaySchedules.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p>No upcoming schedules found.</p>
            {filterClassId && (
               <Link href="/app/classes" className="text-blue-600 text-sm mt-2 block hover:underline">View all other classes</Link>
            )}
          </div>
        ) : displaySchedules.map((item) => {
          const start = formatDisplayDate(item.start_datetime);
          const end = formatDisplayDate(item.end_datetime);
          const isExpanded = expandedScheduleId === item.id;

          return (
            <div key={item.id} className="group relative rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">

<<<<<<< HEAD
              {/* Trainer CRUD button */}
              {primaryRole === "trainer" && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="p-2 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    {start.date}
                  </span>
                  <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                    {start.time} - {end.time}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{item.fitness_class?.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-sm text-slate-500">
                    Trainer: <span className="font-semibold text-slate-700">
                      {trainers.find(t => String(t.id) === String(item.trainer_id))?.name || 'TBA'}
                    </span>
                  </p>
                  <p className="text-sm text-slate-500">Spots: <span className="font-semibold text-slate-700">{item.capacity}</span></p>
                </div>
              </div>

              {/* 只有 Member 角色才能看到 Book Spot 按钮 */}
              {primaryRole === 'member' && (
                <button 
                  onClick={() => alert(`Ready to book ${item.fitness_class?.title} at ${start.time}? \n(Booking API integration goes here)`)}
                  className="mt-6 sm:mt-0 w-full sm:w-auto text-center rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white hover:bg-indigo-600 transition-all shadow-md"
                >
                  Book Spot
                </button>
=======
                {/* --- Trainer CRUD button --- */}
                {primaryRole === "trainer" && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(item)} className="p-2 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {start.date}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{start.time} - {end.time}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{item.fitness_class?.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-slate-500">Trainer: <span className="font-semibold text-slate-700">{item.trainer?.name}</span></p>
                    <p className="text-xs text-slate-500">Spots: <span className="font-semibold text-slate-700">{item.capacity}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  {/* Member: Book Now button with real API call */}
                  {primaryRole === "member" && (
                    <BookNowButton scheduleId={item.id} />
                  )}

                  {/* Trainer: View Attendees toggle */}
                  {primaryRole === "trainer" && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all border ${
                        isExpanded
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {isExpanded ? "Hide Attendees" : "View Attendees"}
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance panel — trainer only, expandable */}
              {primaryRole === "trainer" && isExpanded && (
                <div className="px-6 pb-6">
                  <AttendancePanel
                    scheduleId={item.id}
                    onToast={(message, type) => setToast({ message, type })}
                  />
                </div>
>>>>>>> 2da4572 (feat(booking): implement booking module with State Pattern, attendance marking, admin oversight and BookingResource)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
<<<<<<< HEAD
}

// --- Next.js 页面入口：包装 Suspense 以支持 useSearchParams ---
export default function UserSchedulesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading page...</div>}>
      <SchedulesContent />
    </Suspense>
  );
=======
>>>>>>> 2da4572 (feat(booking): implement booking module with State Pattern, attendance marking, admin oversight and BookingResource)
}