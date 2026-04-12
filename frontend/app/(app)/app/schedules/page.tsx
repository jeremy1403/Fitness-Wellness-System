"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { getSchedules } from "@/lib/api/schedules.api";

export default function UserSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch real schedule data from backend
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getSchedules();
      // Adjust based on your API response structure (data.data or data)
      setSchedules(data.data || data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // 2. Helper to format time for the user UI
  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    };

    return {
      date: start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      range: `${start.toLocaleTimeString([], timeOptions)} - ${end.toLocaleTimeString([], timeOptions)}`
    };
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      <header className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Class Schedule</h2>
        <p className="text-slate-500 text-sm">Find a time that works for you and book your spot.</p>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No classes scheduled for today.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {schedules.map((item) => {
            const { date, range } = formatTimeRange(item.start_datetime, item.end_datetime);
            
            return (
              <div 
                key={item.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl bg-white p-5 border border-slate-100 shadow-sm hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {date}
                    </span>
                    <span className="text-xs text-slate-300">|</span>
                    <p className="text-sm font-medium text-slate-500">{range}</p>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900">
                    {item.fitness_class?.title || "Fitness Class"}
                  </h4>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs font-medium text-slate-600">
                      Trainer: <span className="text-blue-500">{item.trainer?.name || "Assigning..."}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Capacity: {item.capacity} members
                    </p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                  <Link 
                    href="/user/booking" 
                    className="inline-block w-full sm:w-auto text-center rounded-full bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}