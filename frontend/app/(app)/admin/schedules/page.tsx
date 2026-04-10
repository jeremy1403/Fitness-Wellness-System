"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFitnessClasses } from "@/lib/api/classes.api";
import { 
  createSchedule, 
  getSchedules, 
  deleteSchedule, 
  getTrainers 
} from "@/lib/api/schedules.api"; 

// 【新增】导入策略工厂
import { ScheduleStrategyFactory } from "@/lib/strategies/schedule.strategies";

export default function AdminCreateSchedulePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [classId, setClassId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(20); // 默认设为 20

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // --- 自动化策略逻辑：当选择课程或填入开始时间时自动重算 ---
  useEffect(() => {
    // 1. 找到当前选中的课程对象
    const selectedClass = classes.find(c => String(c.id) === String(classId));

    if (selectedClass && startTime) {
      // 2. 确定模式（如果后端没传 setup_mode，默认用 automated）
      // 这里的 duration_minutes 必须确保后端有返回
      const mode = selectedClass.setup_mode || "automated";
      const duration = selectedClass.duration_minutes || 60; // 默认60分钟

      // 3. 通过工厂获得策略并执行计算
      const strategy = ScheduleStrategyFactory.make(mode);
      const calculatedEnd = strategy.calculateEndTime(startTime, duration);

      // 4. 更新结束时间状态
      if (calculatedEnd) {
        setEndTime(calculatedEnd);
      }
    }
  }, [classId, startTime, classes]); // 监听这三个变量

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
      setError("Could not load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        fitness_class_id: classId,
        trainer_id: trainerId,
        // 改回你的数据库字段名，注意确认后端接收的是 start_time 还是 start_datetime
        start_datetime: startTime.replace("T", " "),
        end_datetime: endTime.replace("T", " "),
        capacity: capacity,
      };
      console.log("FINAL PAYLOAD:", payload);
      await createSchedule(payload);
      await loadInitialData(); 
      //reset the form
      setClassId("");
      setTrainerId("");
      setStartTime("");
      setEndTime("");
      // await loadInitialData(); 
      alert("Schedule published successfully!");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
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

            {/* <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assign Trainer
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white">
                <option value="" disabled>Choose a trainer...</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name || t.user?.name}</option>)}
              </select>
              {fieldErrors.trainer_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.trainer_id[0]}</p>}
            </label> */}

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assign Trainer
              <select 
                value={trainerId} 
                onChange={(e) => setTrainerId(e.target.value)} 
                required 
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"
              >
                <option value="" disabled>Choose a trainer...</option>
                {trainers.map(t => (
                  // 这里的 t 就是 User 对象，直接拿 t.id 和 t.name
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Max Capacity (Members)
              <input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(Number(e.target.value))} 
                min="1"
                required 
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" 
                placeholder="e.g. 20"
              />
              {fieldErrors.capacity && <p className="mt-1 text-xs text-red-600">{fieldErrors.capacity[0]}</p>}
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
                    {/* {item.trainer?.user?.name || item.trainer?.name || `Trainer #${item.trainer_id}`} */}
                    {item.trainer?.name || `Trainer #${item.trainer_id}`}
                  </td>
                  {/* <td className="px-4 py-3 text-xs leading-relaxed">
                    <div className="font-semibold">{new Date(item.start_time).toLocaleDateString()}</div>
                    <div className="text-slate-400">
                      {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td> */}
                  <td className="px-4 py-3 text-xs leading-relaxed">
                    {item.start_datetime ? (
                      <>
                        {/* 1. 把空格换成 T，确保 JS 能够正确识别日期格式 */}
                        <div className="font-semibold">
                          {new Date(item.start_datetime.replace(" ", "T")).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400">
                          {/* 2. 这里的字段名必须是 start_datetime 而不是 start_time */}
                          {new Date(item.start_datetime.replace(" ", "T")).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(item.end_datetime.replace(" ", "T")).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400">Time Not Set</span>
                    )}
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