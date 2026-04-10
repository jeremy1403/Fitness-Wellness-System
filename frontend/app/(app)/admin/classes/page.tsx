"use client";

import { useState, useEffect } from "react";
import { createFitnessClass, getFitnessClasses, deleteFitnessClass, updateFitnessClass } from "@/lib/api/classes.api";
import Link from "next/link";

type SetupMode = "automated" | "simple";
type ClassType = "Yoga" | "Spin" | "HIIT" | "General";

export default function AdminCreateClassPage() {
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- 表单状态 ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [classType, setClassType] = useState<ClassType>("Yoga"); 
  const [setupMode, setSetupMode] = useState<SetupMode>("automated");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 编辑状态 ---
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

  // --- 核心：进入编辑模式 ---
  const startEdit = (cls: any) => {
    setEditingId(cls.id);
    setName(cls.title);
    setDescription(cls.description || "");
    setDurationMinutes(cls.duration_minutes);
    setStatus(cls.status);
    // 注意：确保后端返回了这些字段
    setSetupMode(cls.setup_mode || "automated");
    setClassType(cls.class_type || "Yoga");
    
    // 滚回顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setError(null);
  };

  // const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   setError(null);

  //   if (setupMode === 'simple' && durationMinutes < 15) {
  //     setError("Wait! The duration must be at least 15 minutes.");
  //     return; 
  //   }

  //   setSubmitting(true);
  //   try {
  //     const payload = {
  //       title: name,
  //       description: description,
  //       duration_minutes: setupMode === 'simple' ? durationMinutes : getAutoDuration(),
  //       status: status,
  //       //setup_mode: setupMode,
  //       //class_type: classType,
  //     };

  //     if (editingId) {
  //       // 使用封装好的 api 函数
  //       await updateFitnessClass(editingId, payload);
  //       alert("Updated successfully!");
  //   } else {
  //     await createFitnessClass(payload);
  //     alert("Created successfully!");
  //   }

  //     cancelEdit(); // 重置表单
  //     await loadClasses(); 
  //   } catch (e: any) { 
  //     const msg = e.response?.data?.message || "Operation failed.";
  //     setError(msg);
  //   } finally { 
  //     setSubmitting(false); 
  //   }
  // };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // 前端验证：手动模式下时长不能小于 15
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
        // setup_mode: setupMode,
        // class_type: classType,
      };

      if (editingId) {
        // --- 编辑逻辑：调用封装好的 updateFitnessClass ---
        await updateFitnessClass(editingId, payload);
        alert("Updated successfully!");
      } else {
        // --- 创建逻辑 ---
        await createFitnessClass(payload);
        alert("Created successfully!");
      }

      cancelEdit(); // 成功后重置表单并清空 editingId
      await loadClasses(); // 刷新列表
    } catch (e: any) { 
      // 这里的 e.response.data.message 来自于你在 api.ts 里的包装
      const msg = e.response?.data?.message || "Operation failed.";
      setError(msg);
    } finally { 
      setSubmitting(false); 
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteFitnessClass(id);
      setClassList(prev => prev.filter(cls => cls.id !== id));
    } catch (e) {
      alert("Failed to delete class.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {editingId ? "Edit Class" : "Class Management"}
        </h1>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">← Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Existing Class Catalog</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-10 text-center text-slate-400">Loading your classes...</p>
          ) : classList.length === 0 ? (
            <p className="col-span-full py-10 text-center text-slate-400">No classes found.</p>
          ) : classList.map((cls) => (
            <div key={cls.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex justify-between items-center group hover:bg-white hover:border-slate-300 transition-all">
              <div>
                <h3 className="font-bold text-slate-800">{cls.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500">
                        {cls.duration_minutes} mins
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {cls.status}
                    </span>
                </div>
              </div>
              <div className="flex gap-1">
                {/* 编辑按钮 */}
                <button 
                  onClick={() => startEdit(cls)}
                  className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Edit Class"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                {/* 删除按钮 */}
                <button 
                  onClick={() => handleDelete(cls.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete Class"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}