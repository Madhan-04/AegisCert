import React, { useState, useEffect } from 'react';
import { db, ApiLog, User } from '../services/db';
import { Activity, Clock, Server, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ApiAnalytics() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    // Load integration logs
    const instId = user.institutionId || '';
    const keys = db.getApiKeys().filter(k => k.institutionId === instId);
    const keyIds = keys.map(k => k.id);
    const apiLogs = db.getApiLogs().filter(l => keyIds.includes(l.apiKeyId));
    setLogs(apiLogs);
  }, []);

  const stats = React.useMemo(() => {
    const totalRequests = logs.length;
    const avgLatency = totalRequests 
      ? Math.round(logs.reduce((sum, l) => sum + l.responseTime, 0) / totalRequests) 
      : 0;
    const successCount = logs.filter(l => l.status === 200).length;
    const successRatio = totalRequests ? Math.round((successCount / totalRequests) * 100) : 100;
    return { totalRequests, avgLatency, successRatio };
  }, [logs]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Gateway API Analytics</h1>
        <p className="text-sm text-slate-400">
          Monitor response times, error rates, and live integration access attempts on the verification gateway node.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total API Queries</span>
              <div className="text-3xl font-bold text-white">{stats.totalRequests}</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none flex items-center gap-1">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" />+12%</span>
            vs previous week
          </div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Latency</span>
              <div className="text-3xl font-bold text-cyan-400">{stats.avgLatency} ms</div>
            </div>
            <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none flex items-center gap-1">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">Nominal</span>
            Standard response cycle
          </div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success Ratio</span>
              <div className="text-3xl font-bold text-emerald-400">{stats.successRatio}%</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none flex items-center gap-1">
            <span className="text-emerald-400 font-bold">0%</span>
            Active rate limit blocks
          </div>
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-light" />
          Live Request Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Timestamp</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Endpoint Route</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Requester IP</th>
                <th className="pb-3 text-right pr-2">Response Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/2">
                  <td className="py-3 pl-2 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 text-white font-bold">{log.endpoint}</td>
                  <td className="py-3 text-cyan-400">{log.responseTime} ms</td>
                  <td className="py-3 text-slate-400">{log.ip}</td>
                  <td className="py-3 text-right pr-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 200 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.status === 200 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {log.status} OK
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No developer API gateway requests recorded in current session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
