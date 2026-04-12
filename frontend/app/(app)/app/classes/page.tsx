"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFitnessClasses, deleteFitnessClass } from "@/lib/api/classes.api"; // 确保路径正确

export default function UserClassesPage() {
  // --- 1. 定义缺失的状态 ---
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 2. 获取数据的逻辑 ---
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getFitnessClasses();
      // 兼容后端返回 data.data 或 直接返回数组的情况
      setClassList(data.data || data);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // --- 3. 定义操作函数 ---
  const startEdit = (cls: any) => {
    // 如果这是用户页面，通常不需要 startEdit
    // 如果你需要跳转到编辑页，可以使用 router.push(`/admin/classes/edit/${cls.id}`)
    console.log("Editing class:", cls);
    alert("Redirecting to edit or handling edit state...");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteFitnessClass(id);
      setClassList((prev) => prev.filter((cls) => cls.id !== id));
      alert("Deleted successfully");
    } catch (error) {
      alert("Delete failed");
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Existing Class Catalog</h2>
        {/* 如果需要，可以在这里放一个 Back 按钮 */}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full py-10 text-center text-slate-400">Loading your classes...</p>
        ) : classList.length === 0 ? (
          <p className="col-span-full py-10 text-center text-slate-400">No classes found.</p>
        ) : (
          classList.map((cls) => (
            <div
              key={cls.id}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md group"
            >
              {/* 操作按钮 (Admin 可见) */}
              {/* <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(cls)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div> */}

              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {cls.status || "active"}
              </span>

              <h3 className="mt-3 text-xl font-semibold text-slate-900">{cls.title}</h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{cls.duration_minutes} MINS</span>
                <span>•</span>
                <span className="italic">{cls.class_type || "General"}</span>
              </div>

              <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                {cls.description || "No description provided for this class."}
              </p>

              <Link
                // href={`/app/booking?classId=${cls.id}`}
                href="/app/booking"
                className="mt-6 block w-full text-center rounded-full border border-slate-900 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white transition"
              >
                View Schedule & Book
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}