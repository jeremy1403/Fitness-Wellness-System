"use client";
import React from 'react';

// Mock Data
const mockWeatherData = {
  location: "Los Angeles, CA",
  temperature: 72,
  condition: "Sunny",
  humidity: "45%",
  forecast: "Perfect day for an outdoor run!"
};

const mockHealthTips = [
  { id: 1, category: "Recovery", text: "Remember to stretch for 15 minutes post-workout.", priority: "High" },
  { id: 2, category: "Nutrition", text: "Hydrate! Drink at least 8 glasses of water today.", priority: "Medium" },
  { id: 3, category: "Mindfulness", text: "Take 5 minutes for deep breathing exercises.", priority: "Low" }
];

const mockInternalInsights = {
  activeCalories: 450,
  workoutsThisWeek: 3,
  nextBooking: "Yoga with Sarah - Tomorrow 10:00 AM"
};

export default function AnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Health Integration Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Personalized insights combining your activity with real-time wellness data.</p>
          </div>
          <div className="px-5 py-2.5 bg-slate-800/50 rounded-full border border-slate-700/50 backdrop-blur-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-400">Live Sync Active</span>
          </div>
        </header>

        {/* Top Grid: Weather & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Weather Widget */}
          <div className="md:col-span-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 p-6 shadow-2xl shadow-blue-900/20">
            <div className="absolute top-0 right-0 p-6 opacity-30">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-blue-100 font-medium tracking-wide uppercase text-sm">{mockWeatherData.location}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h2 className="text-6xl font-black text-white">{mockWeatherData.temperature}&deg;</h2>
                  <span className="text-blue-100 text-xl font-medium">{mockWeatherData.condition}</span>
                </div>
              </div>
              <div className="mt-8 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-sm text-white font-medium">{mockWeatherData.forecast}</p>
                <p className="text-xs text-blue-100 mt-1">Humidity: {mockWeatherData.humidity}</p>
              </div>
            </div>
          </div>

          {/* Internal Insights Widget */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Active Calories</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-bold text-slate-100">{mockInternalInsights.activeCalories}</h3>
                <span className="text-emerald-400 text-sm font-medium">kcal</span>
              </div>
              <p className="text-xs text-slate-500 mt-4 bg-slate-800/50 inline-block px-3 py-1 rounded-full w-max">Today&apos;s Energy Output</p>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-500">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-700"></div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Weekly Goal</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-bold text-slate-100">{mockInternalInsights.workoutsThisWeek}<span className="text-2xl text-slate-600">/5</span></h3>
              </div>
              <p className="text-xs text-slate-500 mt-4 bg-slate-800/50 inline-block px-3 py-1 rounded-full w-max">Workouts Completed</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Health Tips & Next Booking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/50 border border-slate-800 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                AI Wellness Recommendations
              </h3>
            </div>
            <div className="space-y-4">
              {mockHealthTips.map((tip) => (
                <div key={tip.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 transition-colors flex items-start gap-4">
                  <div className={`w-2 h-full min-h-[40px] rounded-full flex-shrink-0 ${tip.category === 'Recovery' ? 'bg-indigo-500' : tip.category === 'Nutrition' ? 'bg-emerald-500' : 'bg-fuchsia-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tip.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tip.priority === 'High' ? 'bg-red-500/20 text-red-400' : tip.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {tip.priority} Priority
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-8 flex flex-col items-center text-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Up Next</h4>
            <p className="text-xl font-semibold text-slate-200">{mockInternalInsights.nextBooking.split(' - ')[0]}</p>
            <p className="text-indigo-400 font-medium mt-1">{mockInternalInsights.nextBooking.split(' - ')[1]}</p>
            <button className="mt-8 px-6 py-3 w-full rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors duration-300 shadow-lg shadow-indigo-500/25">
              View Schedule
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
