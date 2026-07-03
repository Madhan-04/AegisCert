import React, { useState } from 'react';
import { Calendar, BarChart3, TrendingUp, Cpu, Map } from 'lucide-react';

export default function InstitutionAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'verification' | 'issuance'>('verification');

  // Heatmap hours vs days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['08:00', '12:00', '16:00', '20:00', '00:00'];
  
  // Simulated heatmap weight mapping (high, medium, low)
  const heatmapData = [
    [3, 4, 2, 1, 0], // Mon
    [4, 5, 3, 2, 1], // Tue
    [5, 5, 4, 2, 0], // Wed
    [4, 4, 3, 1, 1], // Thu
    [3, 5, 2, 2, 0], // Fri
    [1, 2, 1, 0, 0], // Sat
    [0, 1, 0, 0, 0], // Sun
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Advanced Institution Analytics</h1>
        <p className="text-sm text-slate-400">
          Visual intelligence tracking verification request schedules, blockchain workload forecasts, and node bandwidth load.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Heatmap Section */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar className="w-5 h-5 text-primary-light" />
            Verification Request Hourly Heatmap
          </h2>

          <div className="space-y-4">
            {/* Heatmap Grid */}
            <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono text-slate-500">
              <span className="text-left font-sans font-bold">DAY</span>
              {hours.map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {days.map((d, dayIdx) => (
                <div key={d} className="grid grid-cols-6 gap-2 items-center text-[10px] font-mono">
                  <span className="text-slate-400 text-left font-sans font-semibold">{d}</span>
                  {heatmapData[dayIdx].map((val, hourIdx) => {
                    // Color mapping based on intensity val
                    let color = 'bg-slate-900/60 border-white/5';
                    if (val === 1) color = 'bg-indigo-950 border-indigo-900/20 text-indigo-400';
                    else if (val === 2) color = 'bg-indigo-900 border-indigo-800/20 text-indigo-300';
                    else if (val === 3) color = 'bg-indigo-800 border-indigo-700/20 text-indigo-200';
                    else if (val === 4) color = 'bg-indigo-700 border-indigo-600/30 text-white';
                    else if (val === 5) color = 'bg-indigo-500 border-indigo-400/40 text-white font-bold';

                    return (
                      <div 
                        key={hourIdx} 
                        className={`py-3 rounded-xl border flex items-center justify-center transition-all hover:scale-105 cursor-default ${color}`}
                        title={`Intensity score: ${val}`}
                      >
                        {val > 0 ? val * 12 : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-end gap-3 text-[9px] text-slate-500 font-semibold pt-2">
              <span>LOW VOLUME</span>
              <div className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-900/20" />
              <div className="w-3.5 h-3.5 rounded bg-indigo-800 border border-indigo-700/20" />
              <div className="w-3.5 h-3.5 rounded bg-indigo-700 border border-indigo-600/30" />
              <div className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-400/40" />
              <span>PEAK LOAD</span>
            </div>
          </div>
        </div>

        {/* Projections & Forecasts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              Degree Issuance Forecast (6 Months)
            </h2>

            {/* Simulated Line Graph */}
            <div className="relative h-44 border-b border-l border-white/5 flex items-end justify-between px-4 pb-2">
              {/* Lines and Grids */}
              <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-white/5" />
              <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-white/5" />

              {/* Data bars acting as mock lines */}
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-16 bg-slate-800 rounded-t-full" />
                <span className="text-[8px] font-mono text-slate-500">AUG</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-20 bg-slate-800 rounded-t-full" />
                <span className="text-[8px] font-mono text-slate-500">SEP</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-28 bg-indigo-600 rounded-t-full" />
                <span className="text-[8px] font-mono text-slate-500">OCT</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-24 bg-slate-800 rounded-t-full" />
                <span className="text-[8px] font-mono text-slate-500">NOV</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-32 bg-indigo-600 rounded-t-full animate-pulse" />
                <span className="text-[8px] font-mono text-slate-500 font-bold text-indigo-400">DEC*</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-2.5 h-36 bg-accent rounded-t-full animate-pulse" />
                <span className="text-[8px] font-mono text-slate-500 font-bold text-accent-light font-sans">JAN*</span>
              </div>
            </div>

            <p className="text-3xs text-slate-500 leading-relaxed">
              * Dec & Jan metrics indicate AI forecasts based on student enrollment registers and upcoming graduation rosters.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
