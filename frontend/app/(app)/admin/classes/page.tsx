"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createFitnessClass, getFitnessClasses, deleteFitnessClass } from "@/lib/api/classes.api"; 
import Link from "next/link";

export default function AdminCreateClassPage() {
  const router = useRouter();

  // 状态定义
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // 1. 加载数据
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getFitnessClasses();
      setClassList(data.data || data); // 适配 Laravel 可能包裹的 data 层
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // 2. 处理提交
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        title: name,
        description: description,
        duration_minutes: durationMinutes,    
      };

      await createFitnessClass(payload);
      
      // 清空表单并刷新列表
      setName("");
      setDescription("");
      setDurationMinutes(60);
      await loadClasses(); 
      alert("Class created successfully!");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setFieldErrors(e.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 处理删除
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteFitnessClass(id);
      setClassList(classList.filter(c => c.id !== id));
    } catch (e) {
      alert("Failed to delete class");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Manage Fitness Classes</h1>
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">&larr; Back</Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Class</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Class Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>}
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 resize-none" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Duration (Mins)
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
        {/* 把标题和描述文字包在一起，它们就会一起靠在顶部 */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
          <p className="mt-2 text-xs text-slate-500">
            Publishing this schedule will immediately allow members to start booking slots based on their membership tier.
          </p>
        </div>

        {/* 按钮会因为 justify-between 被推到最底部 */}
        <button 
          type="submit" 
          disabled={submitting} 
          className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Create Class"}
        </button>
      </section>
      </form>

      {/* List Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Existing Classes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Loading...</p>
          ) : classList.map((cls) => (
            <div key={cls.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{cls.title}</h3>
                <p className="text-xs text-slate-500">{cls.duration_minutes} mins</p>
              </div>
              <button onClick={() => handleDelete(cls.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}