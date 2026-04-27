"use client";

import { useState, useEffect } from "react";
import { 
  createFitnessClass, 
  getFitnessClasses, 
  deleteFitnessClass, 
  updateFitnessClass 
} from "@/lib/api/classes.api";
import { getSchedules } from "@/lib/api/schedules.api"; 
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";

type SetupMode = "automated" | "simple";
type ClassType = "Yoga" | "Spin" | "HIIT" | "General";

export default function UserClassesPage() {
  const { primaryRole, user } = useAuth();
  
  // data status
  const [classList, setClassList] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]); // Store scheduling data
  const [loading, setLoading] = useState(true);
  
  // Form Status (Trainer Only)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [classType, setClassType] = useState<ClassType>("Yoga");
  const [setupMode, setSetupMode] = useState<SetupMode>("automated");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const getAutoDuration = () => {
    const rules: Record<ClassType, number> = {
      'Yoga': 60, 'Spin': 45, 'HIIT': 30, 'General': 60
    };
    return rules[classType];
  };


  //Load Classes and Schedules simultaneously
    const loadData = async () => {
      try {
        setLoading(true);
        const [classesRes, schedulesRes] = await Promise.all([
          getFitnessClasses(),
          getSchedules() 
        ]);
        
        const finalClasses = Array.isArray(classesRes) ? classesRes : (classesRes as any)?.data || [];
        const finalSchedules = Array.isArray(schedulesRes) ? schedulesRes : (schedulesRes as any)?.data || [];

        setClassList(finalClasses);
        setScheduleList(finalSchedules);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => { loadData(); }, []);

  // Retrieve scheduling statistics and the latest scheduling for a specific class
  const getClassStats = (classId: number) => {
    // 1. Locate all available slots for this course that are currently available.
    const relatedSchedules = scheduleList.filter(
      (s) => s.fitness_class_id === classId && s.status === 'open'
    );
    
    // 2.Filter out future courses (after the current time).
    const now = new Date().getTime();
    const upcomingSchedules = relatedSchedules.filter(
      (s) => new Date(s.start_datetime).getTime() >= now
    );

    // 3.earliest entries first
    upcomingSchedules.sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    return {
      count: relatedSchedules.length, // How many different time slots are there in total?
      latest: upcomingSchedules[0] || null // The closest next class
    };
  };

  // --- Trainer action ---
  const startEdit = (cls: any) => {
    setEditingId(cls.id);
    setName(cls.title);
    setDescription(cls.description || "");
    setClassType(cls.class_type || "General");
    setDurationMinutes(cls.duration_minutes);
    
    const autoTime = { 'Yoga': 60, 'Spin': 45, 'HIIT': 30, 'General': 60 }[cls.class_type as ClassType];
    if (cls.duration_minutes !== autoTime) {
      setSetupMode("simple");
    } else {
      setSetupMode("automated");
    }

    setStatus(cls.status || "active");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setStatus("active");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (setupMode === 'simple' && durationMinutes < 15) {
      setError("The duration must be at least 15 minutes.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: name,
        description: description,
        duration_minutes: setupMode === 'simple' ? durationMinutes : getAutoDuration(),
        status: status,
        user_id: user?.id,
      };

      if (editingId) {
        await updateFitnessClass(editingId, payload);
        alert("Updated successfully!");
      } else {
        await createFitnessClass(payload);
        alert("Created successfully!");
      }

      cancelEdit();
      await loadData(); 
    } catch (e: any) {
      setError(e.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteFitnessClass(id);
      setClassList(prev => prev.filter(cls => cls.id !== id));
    } catch (e) { alert("Delete failed."); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* top title */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {primaryRole === 'trainer' ? (editingId ? "Edit Class" : "Class Management") : "Class Catalog"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {primaryRole === 'trainer' 
              ? "Create and manage your fitness classes." 
              : "Browse available classes and check schedules."}
          </p>
        </div>
        <Link href="/app" className="text-sm font-medium px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
          ← Back
        </Link>
      </div>

      {/* Trainer form area */}
      {primaryRole === "trainer" && (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-500">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {error && (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <label className="text-sm font-medium sm:col-span-2">
                Class Name
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full rounded-2xl border px-4 py-3" />
              </label>

              <label className="text-sm font-medium">
                Setup Mode
                <select value={setupMode} onChange={(e) => setSetupMode(e.target.value as SetupMode)} className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white">
                  <option value="automated">Automated (Strategy)</option>
                  <option value="simple">Simple (Manual)</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Class Type
                <select value={classType} onChange={(e) => setClassType(e.target.value as ClassType)} className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white">
                  <option value="Yoga">Yoga</option>
                  <option value="Spin">Spin</option>
                  <option value="HIIT">HIIT</option>
                  <option value="General">General</option>
                </select>
              </label>

              {setupMode === 'simple' && (
                <label className="text-sm font-medium sm:col-span-2">
                  Manual Duration (Minutes)
                  <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="mt-2 w-full rounded-2xl border px-4 py-3" />
                </label>
              )}

              <label className="text-sm font-medium sm:col-span-2">
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3 bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-2 w-full rounded-2xl border px-4 py-3" />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Strategy Info</h2>
              <div className="mt-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] text-indigo-500 font-bold uppercase">Planned Duration</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {setupMode === 'automated' ? `${getAutoDuration()} MINS` : `${durationMinutes} MINS`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-slate-900 px-6 py-4 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-all">
                {submitting ? "Saving..." : editingId ? "Update Class" : "Create Class"}
              </button>
              {editingId && (
                <button onClick={cancelEdit} type="button" className="w-full text-sm text-slate-500 hover:text-slate-800">
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        </form>
      )}

      {/* Course Catalog List Area */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-slate-900">
          {primaryRole === 'trainer' ? "Existing Class Catalog" : "Available Classes"}
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-10 text-center text-slate-400">Loading classes and schedules...</p>
          ) : classList.length === 0 ? (
            <p className="col-span-full py-10 text-center text-slate-400">No classes found.</p>
          ) : classList.map((cls) => {
            
            // Permission verification
            if (primaryRole !== 'trainer' && cls.status === 'inactive') return null;
            if (primaryRole === 'trainer' && cls.created_by !== user?.id && cls.created_by !== 1) return null;

            // Get the course scheduling statistics
            const stats = getClassStats(cls.id);

            return (
              <div key={cls.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50 group hover:bg-white hover:border-slate-300 transition-all relative flex flex-col justify-between">

                {/* Trainer btn */}
                {primaryRole === "trainer" && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(cls)} className="p-2 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="p-2 bg-white text-red-600 rounded-xl shadow-sm border border-slate-100 hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                )}

                {/* Basic Course Information */}
                <div>
                  <h3 className="mt-3 text-xl font-bold text-slate-800 pr-16">{cls.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">{cls.duration_minutes} MINS</span>
                    <span className="text-slate-300">•</span>
                    <span className={`text-xs font-bold uppercase ${cls.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                      {cls.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600 line-clamp-2 h-10">{cls.description || "No description."}</p>

                  {/* Per-class price tag — visible to members */}
                  {primaryRole !== 'trainer' && (
                    <div className="mt-3 inline-flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">À-la-carte</span>
                      <span className={`text-sm font-black ${
                        Number(cls.price) === 0
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}>
                        {Number(cls.price) === 0 ? 'Free' : `RM ${Number(cls.price).toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  {/* schedule display panel */}
                  <div className="mt-6 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedules</p>
                        <p className="text-base font-bold text-indigo-600 mt-1">
                          {stats.count} {stats.count === 1 ? 'Session' : 'Sessions'} 
                        </p>
                      </div>
                    </div>
                    
                    {/* lastest schedule */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Next Session</p>
                      {stats.latest ? (
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {new Date(stats.latest.start_datetime).toLocaleDateString('en-GB')} at {new Date(stats.latest.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 italic">No upcoming schedules</p>
                      )}
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/app/schedules?classId=${cls.id}`} 
                  className="mt-6 block w-full text-center rounded-2xl bg-white border border-slate-900 py-3 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  {primaryRole === 'trainer' ? "Manage Schedules" : "View In Schedule"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}