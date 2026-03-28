"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// 1. 注意这里：分别从两个 API 文件导入
import { getFitnessClasses } from "@/lib/api/classes.api";
import { 
  createSchedule, 
  getSchedules, 
  deleteSchedule, 
  getTrainers 
} from "@/lib/api/schedules.api"; 

export default function AdminCreateSchedulePage() {
  // --- 数据源状态 ---
  const [classes, setClasses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 表单状态 ---
  const [classId, setClassId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // 加载数据
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classesData, trainersData, schedulesData] = await Promise.all([
        getFitnessClasses(),
        getTrainers(),
        getSchedules()
      ]);
      setClasses(classesData.data || classesData);
      setTrainers(trainersData.data || trainersData);
      setScheduleList(schedulesData.data || schedulesData);
    } catch (err) {
      console.error("Load error:", err);
      setError("Could not load schedules. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 提交创建
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        fitness_class_id: classId,
        trainer_id: trainerId,
        // 处理 HTML5 datetime-local 的 'T' 字符，使其符合数据库格式
        start_time: startTime.replace("T", " "),
        end_time: endTime.replace("T", " "),
      };

      await createSchedule(payload);
      
      // 重置并刷新
      setClassId("");
      setTrainerId("");
      setStartTime("");
      setEndTime("");
      await loadInitialData(); 
      alert("Schedule published successfully!");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setFieldErrors(e.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this schedule slot?")) return;
    try {
      await deleteSchedule(id);
      // 乐观更新界面
      setScheduleList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete the schedule.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Manage Schedule</h1>
          <p className="mt-2 text-sm text-slate-600">Assign a class, trainer, and specific time slot.</p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          &larr; Back
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Schedule Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Select Class
              <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white">
                <option value="" disabled>Choose a fitness class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {fieldErrors.fitness_class_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.fitness_class_id[0]}</p>}
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assign Trainer
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white">
                <option value="" disabled>Choose a trainer...</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name || t.user?.name}</option>)}
              </select>
              {fieldErrors.trainer_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.trainer_id[0]}</p>}
            </label>

            <label className="text-sm font-medium text-slate-700">
              Start Time
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              {fieldErrors.start_time && <p className="mt-1 text-xs text-red-600">{fieldErrors.start_time[0]}</p>}
            </label>

            <label className="text-sm font-medium text-slate-700">
              End Time
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              {fieldErrors.end_time && <p className="mt-1 text-xs text-red-600">{fieldErrors.end_time[0]}</p>}
            </label>
          </div>
        </section>

        {/* Actions Panel */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
            <p className="mt-2 text-xs text-slate-500">
              Publishing this schedule will immediately allow members to start booking slots based on their membership tier.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Schedule"}
          </button>
        </section>
      </form>

      {/* List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Schedules</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">Loading schedules...</td></tr>
              ) : scheduleList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">No schedules found.</td></tr>
              ) : scheduleList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition group">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.fitness_class?.title || `Class #${item.fitness_class_id}`}
                  </td>
                  <td className="px-4 py-3">
                    {item.trainer?.user?.name || item.trainer?.name || `Trainer #${item.trainer_id}`}
                  </td>
                  <td className="px-4 py-3 text-xs leading-relaxed">
                    <div className="font-semibold">{new Date(item.start_time).toLocaleDateString()}</div>
                    <div className="text-slate-400">
                      {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="text-red-500 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}