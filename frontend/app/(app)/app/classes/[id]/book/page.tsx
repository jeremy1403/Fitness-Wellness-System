"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { getSchedules, getTrainers } from "@/lib/api/schedules.api";
import { bookingsApi } from "@/lib/api/bookings.api";
import { membershipApi } from "@/lib/api/membership.api";
import { http } from "@/lib/api/http";
import { ApiError } from "@/lib/api/http";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
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

// ─── Main Content ─────────────────────────────────────────────────────────────
function ClassBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const scheduleId = Number(searchParams.get("schedule_id"));
  const classId = Number(params.id);

  const [schedule, setSchedule] = useState<any>(null);
  const [fitnessClass, setFitnessClass] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [trainerName, setTrainerName] = useState<string>("TBA");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!scheduleId || !classId) {
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        const [schedulesData, trainersData, classRes, membershipRes] = await Promise.all([
          getSchedules(),
          getTrainers(),
          http<{ data?: any }>(`/classes/${classId}`).catch(() => ({ data: null })),
          membershipApi.myMembership().catch(() => ({ data: null }))
        ]);
        
        const schedulesArr = Array.isArray(schedulesData) ? schedulesData : (schedulesData as any)?.data || [];
        const sched = schedulesArr.find((s: any) => String(s.id) === String(scheduleId));
        setSchedule(sched || null);

        setFitnessClass(classRes?.data || null);
        
        setMembership(membershipRes?.data || null);

        if (sched && trainersData) {
          const t = trainersData.find((tr: any) => String(tr.id) === String(sched.trainer_id));
          if (t) setTrainerName(t.name);
        }
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [scheduleId, classId]);

  const handleConfirm = async () => {
    if (!scheduleId) return;
    
    setBooking(true);
    try {
      const res = await bookingsApi.create({ class_schedule_id: scheduleId });

      if (!res.requires_payment) {
        setToast({ message: "🎉 Successfully booked using your daily quota!", type: "success" });
        setTimeout(() => router.push("/app/bookings"), 1500);
      } else {
        router.push(`/app/payments?booking_id=${res.booking_id}&amount=${res.class_price}`);
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Booking failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setBooking(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return { date: "", time: "" };
    const d = new Date(dateStr);
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      time: `${hours}:${minutes}`
    };
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading details...</div>;
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg font-semibold text-slate-700">Schedule not found.</p>
        <button onClick={() => router.back()} className="mt-2 text-sm font-semibold text-slate-600 underline">← Go Back</button>
      </div>
    );
  }

  const start = formatDisplayDate(schedule.start_datetime);
  const end = formatDisplayDate(schedule.end_datetime);

  const startObj = new Date(schedule.start_datetime);
  const endObj = new Date(schedule.end_datetime);
  const durationInMinutes = (endObj.getTime() - startObj.getTime()) / (1000 * 60);
  const numericPrice = Math.ceil(durationInMinutes / 5) * 3;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400 p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Booking Confirmation</p>
            <h1 className="text-2xl font-black text-slate-900">Review your booking</h1>
            <p className="text-sm text-slate-500 mt-1">Please confirm the details below.</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Membership Context Banner */}
      <div className={`rounded-2xl px-5 py-4 text-sm font-medium border flex items-center gap-3 ${
        membership 
          ? "bg-blue-50 border-blue-200 text-blue-800" 
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}>
        <div className={`w-2 h-2 rounded-full shrink-0 ${membership ? 'bg-blue-500' : 'bg-amber-500'}`} />
        {membership 
          ? "Checking daily quota availability..."
          : "A-la-carte Class: Payment Required"
        }
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900">{fitnessClass?.title ?? schedule.fitness_class?.title}</h2>
          <p className="text-sm text-slate-500 line-clamp-2">{fitnessClass?.description ?? schedule.fitness_class?.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Date & Time</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{start.date}</p>
            <p className="text-sm text-slate-600">{start.time} - {end.time}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Trainer</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{trainerName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-bold text-slate-500">
            Price {membership ? '(If Quota Exceeded)' : '(A-la-carte)'}
          </p>
          <span className="text-xl font-black text-slate-900">
            RM {numericPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={booking}
        className="w-full rounded-full bg-slate-900 py-4 text-base font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {booking ? "Confirming..." : "Confirm Booking"}
      </button>

      <p className="text-center text-xs text-slate-400 pb-6">
        By confirming, you agree to our booking policy. If a payment is required, you will be redirected to checkout.
      </p>
    </div>
  );
}

export default function ClassBookingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading...</div>}>
      <ClassBookingContent />
    </Suspense>
  );
}
