"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFitnessClasses } from "@/lib/api/classes.api";
import { 
  createSchedule, 
  getSchedules, 
  deleteSchedule, 
  getTrainers,
  updateSchedule 
} from "@/lib/api/schedules.api"; 
import { ScheduleStrategyFactory } from "@/lib/strategies/schedule.strategies";

export default function AdminCreateSchedulePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 表单状态 ---
  const [classId, setClassId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(20);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // --- 编辑状态 ---
  const [editingId, setEditingId] = useState<number | null>(null);

  // 1. 初始化数据
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
      setError("Could not load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  // 2. 自动化策略（计算结束时间）
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

  // --- 辅助：格式化表格显示日期 ---
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return { date: "N/A", time: "" };
    const dateObj = new Date(dateStr);
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) return { date: dateStr, time: "" };
    
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- 核心：进入编辑模式 ---
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setClassId(String(item.fitness_class_id));
    setTrainerId(String(item.trainer_id));
    setCapacity(item.capacity);
    
    // 适配 datetime-local 格式 (处理 ISO 或带空格的格式)
    const formatToInput = (str: string) => {
      if (!str) return "";
      const d = new Date(str);
      // 转换为当地时间格式：YYYY-MM-DDTHH:mm
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    setStartTime(formatToInput(item.start_datetime));
    setEndTime(formatToInput(item.end_datetime));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setClassId("");
    setTrainerId("");
    setStartTime("");
    setEndTime("");
    setCapacity(20);
    setError(null);
    setFieldErrors({});
  };

  // 3. 提交处理
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        fitness_class_id: classId,
        trainer_id: trainerId,
        // 发送给后端时去掉 T
        start_datetime: startTime.replace("T", " "),
        end_datetime: endTime.replace("T", " "),
        capacity: capacity,
      };

      if (editingId) {
        await updateSchedule(editingId, payload);
        alert("Schedule updated successfully!");
      } else {
        await createSchedule(payload);
        alert("Schedule published successfully!");
      }

      cancelEdit(); 
      await loadInitialData(); 
    } catch (e: any) {
      setError(e.message || "Operation failed.");
      setFieldErrors(e.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteSchedule(id);
      setScheduleList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {editingId ? "Edit Schedule" : "Manage Schedule"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
             {editingId ? `Modifying slot #${editingId}` : "Assign a class, trainer, and specific time slot."}
          </p>
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
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assign Trainer
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white">
                <option value="" disabled>Choose a trainer...</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Start Time
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>

            <label className="text-sm font-medium text-slate-700">
              End Time
              {/* <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" /> */}
              <input type="datetime-local" value={endTime} readOnly className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Max Capacity
              <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} min="1" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
          </div>
        </section>

        {/* Actions Panel */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
            <p className="mt-2 text-xs text-slate-500">
              {editingId ? "Changes will take effect immediately upon saving." : "Publishing will allow members to start booking slots."}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className={`mt-6 w-full rounded-full px-6 py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 ${editingId ? 'bg-blue-600' : 'bg-slate-900'}`}
            >
              {submitting ? "Saving..." : editingId ? "Update Schedule" : "Publish Schedule"}
            </button>
            {editingId && (
              <button onClick={cancelEdit} type="button" className="text-sm text-slate-500 hover:text-slate-800 text-center">
                Cancel Edit
              </button>
            )}
          </div>
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
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Loading schedules...</td></tr>
              ) : scheduleList.map((item) => {
                const start = formatDisplayDate(item.start_datetime);
                const end = formatDisplayDate(item.end_datetime);
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition group">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.fitness_class?.title}</td>
                    <td className="px-4 py-3">{item.trainer?.name}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold">{start.date}</div>
                      <div className="text-slate-400">{start.time} - {end.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {item.capacity} members
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(item)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}