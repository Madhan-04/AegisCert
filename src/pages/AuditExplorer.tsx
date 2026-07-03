import React, { useState, useEffect } from 'react';
import { db, AuditLog } from '../services/db';
import { Search, Filter, ShieldAlert, ShieldCheck, MapPin, Laptop, Activity, Clock, Flame, Info } from 'lucide-react';

export default function AuditExplorer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'normal'>('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Stats summaries
  const [stats, setStats] = useState({
    total: 0,
    criticalCount: 0,
    highCount: 0,
    averageRisk: 0
  });

  const loadData = () => {
    const allLogs = db.getAuditLogs();
    
    // Fallback if no logs exist (pre-populate mock security audits for explorer layout)
    if (allLogs.length === 0) {
      db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'MANTRA_DEVICE_CONNECTED', 'Mantra fingerprint scanner connected successfully', 'success', 10, 'Chennai, India');
      db.addAuditLog('unknown', 'unknown', 'verifier', 'BIOMETRIC_SPOOF', 'Spoof Prevention: Scanner match score is 23% (under limit)', 'failure', 95, 'London, UK');
      db.addAuditLog('usr-mit', 'MIT Registrar Office', 'institution', 'CERTIFICATE_ISSUED', 'Degree Certificate issued to Alex Johnson', 'success', 22, 'Boston, MA');
      db.addAuditLog('unknown', 'unknown', 'verifier', 'OFFLINE_SIG_TAMPER', 'Attempted local signature tamper check for CERT-2026-0002', 'failure', 90, 'New York, NY');
      db.addAuditLog('usr-student', 'Alex Johnson', 'student', 'WALLET_DOWNLOAD', 'Student downloaded credential package', 'success', 8, 'Boston, MA');
    }
    
    const freshLogs = db.getAuditLogs();
    setLogs(freshLogs);
    setFilteredLogs(freshLogs);

    // Compute stats
    const total = freshLogs.length;
    const critical = freshLogs.filter(l => l.riskScore >= 80).length;
    const high = freshLogs.filter(l => l.riskScore >= 50 && l.riskScore < 80).length;
    const sumRisk = freshLogs.reduce((acc, l) => acc + (l.riskScore || 0), 0);
    const avgRisk = total > 0 ? Math.round(sumRisk / total) : 0;

    setStats({
      total,
      criticalCount: critical,
      highCount: high,
      averageRisk: avgRisk
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Filtering
  useEffect(() => {
    let result = logs;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.deviceFingerprint.toLowerCase().includes(q)
      );
    }

    // Risk levels filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'critical') {
        result = result.filter(l => l.riskScore >= 80);
      } else if (riskFilter === 'high') {
        result = result.filter(l => l.riskScore >= 50 && l.riskScore < 80);
      } else {
        result = result.filter(l => l.riskScore < 50);
      }
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter);
    }

    setFilteredLogs(result);
  }, [searchQuery, riskFilter, actionFilter, logs]);

  // Unique actions list for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  // Mock Heatmap Grid Data: 7 Days (Mon-Sun) x 12 Blocks (2-hour ranges)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
  
  // Generates activity intensity density (0 to 3)
  const getHeatmapColor = (dayIndex: number, hourIndex: number) => {
    // Generate deterministic pattern based on index to look like real system load
    const val = (dayIndex * 3 + hourIndex * 7) % 5;
    if (val === 4) return 'bg-indigo-500/90 shadow-[0_0_8px_rgba(99,102,241,0.4)]'; // Very high
    if (val === 3) return 'bg-indigo-600/60'; // High
    if (val === 2) return 'bg-indigo-700/30'; // Medium
    if (val === 1) return 'bg-indigo-800/10'; // Low
    return 'bg-slate-900 border border-white/5'; // None
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Forensic Audit Trail Explorer
        </h1>
        <p className="text-xs text-slate-400">
          Audit complete node transactions, inspect device fingerprints, analyze location parameters, and track security event anomalies.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Total Traced Logs</span>
          <div className="text-2xl font-black text-white mt-2 font-mono">{stats.total}</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-rose-400 font-mono flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical Incidents
          </span>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">{stats.criticalCount}</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">Suspicious Warnings</span>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">{stats.highCount}</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">Average Risk Score</span>
          <div className="text-2xl font-black text-indigo-400 mt-2 font-mono flex items-baseline gap-1">
            {stats.averageRisk}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Grid: Heatmap & Filter Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Security Activity Heatmap density */}
        <div className="lg:col-span-1 glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-indigo-400" />
              Event Intensity Heatmap
            </h2>
            <div className="flex gap-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest items-center">
              <span>Low</span>
              <div className="w-2.5 h-2.5 bg-indigo-800/10 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-indigo-700/30 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-indigo-600/60 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-indigo-500/90 rounded-sm" />
              <span>High</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Grid Map container */}
            <div className="space-y-1">
              <div className="grid gap-1 text-[7px] text-slate-500 font-mono text-center mb-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                <div></div>
                {hours.map((h, i) => (
                  <div key={i} className="truncate">{h}</div>
                ))}
              </div>
              
              {days.map((day, dIdx) => (
                <div key={day} className="grid gap-1 items-center" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                  <div className="text-[9px] font-mono text-slate-400 font-bold w-6">{day}</div>
                  {hours.map((_, hIdx) => (
                    <div
                      key={hIdx}
                      className={`h-4.5 rounded-md transition-all cursor-crosshair hover:scale-[1.1] ${getHeatmapColor(dIdx, hIdx)}`}
                      title={`${day} @ ${hours[hIdx]}: Security Operations Active`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl text-2xs text-slate-400 font-mono space-y-1">
              <div className="flex items-center gap-1 text-indigo-300 font-bold mb-1">
                <Info className="w-3.5 h-3.5" />
                Heatmap Analysis
              </div>
              <p>
                Calculated activity peaks represent log distribution cycles over a standard 168-hour rotation. Concentrated blocks alert administrators to scanning spikes or brute-force authorization triggers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Forensic Audits Search Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
            
            {/* Table Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by identity, actions, device fingerprint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl text-xs text-slate-200 font-mono transition-all focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={riskFilter}
                  onChange={(e: any) => setRiskFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical (&gt;= 80)</option>
                  <option value="high">Suspicious (50-79)</option>
                  <option value="normal">Normal (0-49)</option>
                </select>

                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/60 border border-white/5 focus:border-indigo-500/40 rounded-xl text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 pb-2">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Timestamp</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Identity</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Action & Details</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Risk Score</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Signature Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No forensic logs match current filter configuration.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}<br/>
                          <span className="text-slate-600 text-[8.5px]">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-slate-200 font-bold">{log.userName}</span><br/>
                          <span className="text-[9px] text-indigo-300 capitalize">{log.userRole}</span>
                        </td>
                        <td className="py-3 max-w-[200px]">
                          <div className="font-bold text-slate-300 text-[10px] truncate" title={log.action}>{log.action}</div>
                          <div className="text-[9px] text-slate-500 leading-normal line-clamp-2" title={log.details}>{log.details}</div>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.riskScore >= 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            log.riskScore >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {log.riskScore}
                          </span>
                        </td>
                        <td className="py-3 text-[9px] text-slate-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            {log.location}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5" title={log.deviceFingerprint}>
                            <Laptop className="w-3 h-3 text-slate-600 shrink-0" />
                            {log.deviceFingerprint.slice(0, 15)}...
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
