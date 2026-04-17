"use client";

import { useState, useEffect } from "react";
import { 
  createFitnessClass, 
  getFitnessClasses, 
  deleteFitnessClass, 
  updateFitnessClass 
} from "@/lib/api/classes.api";
import { useAuth } from "@/lib/auth/context"; // 使用 Auth Context 获取角色
import Link from "next/link";

type SetupMode = "automated" | "simple";
type ClassType = "Yoga" | "Spin" | "HIIT" | "General";

export default function UserClassesPage() {
  // const { primaryRole } = useAuth(); // 获取角色 (trainer, member, admin)
  const { primaryRole, user } = useAuth(); // 把 user 也解构出来
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getFitnessClasses();
      setClassList(data.data || data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const startEdit = (cls: any) => {
    setEditingId(cls.id);
    setName(cls.title);
    setDescription(cls.description || "");
    
    // 核心修改：设置 Class Type 和 Duration
    setClassType(cls.class_type || "General");
    setDurationMinutes(cls.duration_minutes);
    
    // 逻辑判断：如果数据库里的时间不符合预设策略，自动切换到 simple 模式
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
      await loadClasses();
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {primaryRole === 'trainer' ? (editingId ? "Edit Class" : "Class Management") : "Class Catalog"}
        </h1>
        <Link href="/app" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
      </div>

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

      {/* 课程目录列表 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">
          {primaryRole === 'trainer' ? "Existing Class Catalog" : "Available Classes"}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-10 text-center text-slate-400">Loading classes...</p>
          ) : classList.length === 0 ? (
            <p className="col-span-full py-10 text-center text-slate-400">No classes found.</p>
          ) : classList.map((cls) => {
            if (primaryRole !== 'trainer' && cls.status === 'inactive') {
              return null;
            }
            // 2. 如果是 Trainer，并且这堂课【不是】自己建的，也【不是】Admin(ID 1)建的，就隐藏掉
            if (primaryRole === 'trainer' && cls.created_by !== user?.id && cls.created_by !== 1) {
              return null;
            }

            return (
              <div key={cls.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50 group hover:bg-white hover:border-slate-300 transition-all relative">

                {/* --- 只有 Trainer 显示 CRUD 按钮 --- */}
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

                <h3 className="mt-3 text-xl font-bold text-slate-800">{cls.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-medium">{cls.duration_minutes} MINS</span>
                  <span className="text-slate-300">•</span>
                  <span className={`text-xs font-bold uppercase ${cls.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                    {cls.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600 line-clamp-2 h-10">{cls.description || "No description."}</p>

                <Link href="/app/booking" className="mt-6 block w-full text-center rounded-full bg-white border border-slate-900 py-3 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                  View Schedule & Book
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}