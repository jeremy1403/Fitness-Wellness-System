"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context"; // 使用 Auth Context
import { getFitnessClasses } from "@/lib/api/classes.api";
import { 
  createSchedule, 
  getSchedules, 
  deleteSchedule, 
  getTrainers,
  updateSchedule 
} from "@/lib/api/schedules.api"; 
import { ScheduleStrategyFactory } from "@/lib/strategies/schedule.strategies"; 

export default function UserSchedulesPage() {
  const { primaryRole, user } = useAuth(); // 获取角色和当前用户信息
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
  const [editingId, setEditingId] = useState<number | null>(null);

// 1. 初始化数据
  // const loadInitialData = async () => {
  //   try {
  //     setLoading(true);
  //     const [classesData, trainersData, schedulesData] = await Promise.all([
  //       getFitnessClasses(),
  //       getTrainers(),
  //       getSchedules()
  //     ]);
      
  //     const trainersList = trainersData.data || trainersData;
      
  //     setClasses(classesData.data || classesData);
  //     setTrainers(trainersList);
  //     setScheduleList(schedulesData.data || schedulesData);

  //     // --- 关键修复：把 User ID 转换成 Trainer ID ---
  //     if (primaryRole === 'trainer' && user) {
  //       // 既然没有 user_id，我们用 name 来匹配！
  //       const myTrainerProfile = trainersList.find(
  //         (t: any) => t.name === user.name
  //       );

  //       if (myTrainerProfile) {
  //         setTrainerId(String(myTrainerProfile.id)); 
  //         console.log("成功通过名字匹配到教练 ID:", myTrainerProfile.id);
  //       } else {
  //         console.error("无法通过名字匹配教练档案");
  //       }
  //     }
  //   } catch (err) {
  //     setError("Could not load initial data.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // 1. 初始化数据 (修改后)
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classesData, trainersData, schedulesData] = await Promise.all([
        getFitnessClasses(),
        getTrainers(),
        getSchedules()
      ]);
      
      setClasses(classesData.data || classesData);
      setTrainers(trainersData);
      setScheduleList(schedulesData);

    } catch (err) {
      setError("Could not load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    // 只有当角色是教练，且 user 数据加载完毕，且 trainers 列表也加载完毕时才执行
    if (primaryRole === 'trainer' && user && trainers.length > 0) {
      const myTrainerProfile = trainers.find(
        (t: any) => t.name === user.name
      );

      if (myTrainerProfile) {
        setTrainerId(String(myTrainerProfile.id)); 
        console.log("【成功锁定】教练表ID已被设置为:", myTrainerProfile.id);
      } else {
        console.error("【匹配失败】在教练名单中找不到名字为", user.name, "的教练");
      }
    }
  }, [user, primaryRole, trainers]); // 只要这三个变量有变化，就重新运行
  
  // 2. 自动化策略：计算结束时间
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

  // --- 辅助：适配日期输入框格式 ---
  const formatToInput = (str: string) => {
    if (!str) return "";
    const d = new Date(str);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // --- 辅助：格式化日期显示 ---
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- 管理功能 ---
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
        alert("Updated successfully!");
      } else {
        await createSchedule(payload);
        alert("Published successfully!");
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

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {primaryRole === 'trainer' ? (editingId ? " Edit Schedule" : " Manage Schedules") : "Class Schedule"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {primaryRole === 'trainer' ? "Assign classes to time slots." : "Find a time that works and book your spot."}
          </p>
        </div>
        <Link href="/app" className="text-sm font-medium text-slate-500 hover:text-slate-900">← Back</Link>
      </div>

      {/* --- Trainer 表单 --- */}
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
                    .filter(c => c.status === 'active') // 只保留 status 为 active 的课
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))
                  }
                </select>
              </label>
                {/* 将原来的 select 替换为这个只读显示 */}
              <label className="text-sm font-medium sm:col-span-2 text-slate-700">
                Assign Trainer
                <div className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user?.name}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                      ME
                    </span>
                  </div>
                  {/* 如果 trainerId 为空，显示一个小警告，方便你调试 */}
                  {!trainerId && <span className="text-[10px] text-red-500 font-bold">ID NOT FOUND!</span>}
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>

                {/* 核心改动：这里必须传 trainerId 状态，而不是 user.id */}
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

      {/* --- Schedule 列表 --- */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading schedules...</div>
        ) : scheduleList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">No schedules found.</div>
        ) : scheduleList.map((item) => {
          if (item.fitness_class?.status !== 'active') {
            return null;
          }
          const start = formatDisplayDate(item.start_datetime);
          const end = formatDisplayDate(item.end_datetime);

          return (
            <div key={item.id} className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-3xl bg-white p-6 border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300">

              {/* --- Trainer CRUD 按钮 --- */}
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

              <Link href="/app/booking" className="mt-4 sm:mt-0 w-full sm:w-auto text-center rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
                Book Now
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
