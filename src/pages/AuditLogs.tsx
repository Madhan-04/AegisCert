import React, { useState, useEffect } from 'react';
import { db, AuditLog } from '../services/db';
import { FileText, Search, Download, Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLogs(db.getAuditLogs());
  }, []);

  const handleExport = () => {
    // Generate simple CSV download text in browser
    const header = 'ID,Timestamp,User ID,Username,Role,Action,Details,Status\n';
    const csvContent = logs.map(l => 
      `"${l.id}","${l.timestamp}","${l.userId}","${l.userName}","${l.userRole}","${l.action}","${l.details.replace(/"/g, '""')}","${l.status}"`
    ).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aegiscert_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter ? l.action === actionFilter : true;

    return matchesSearch && matchesAction;
  });

  // Extract unique actions for filters
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Cryptographic Audit Logs</h1>
          <p className="text-sm text-slate-400">View and inspect the chronological system registry of database updates, logins, and consensus events.</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Audit Ledger (.CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <section className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input text-xs"
          />
        </div>

        <div className="w-full md:w-auto ml-auto flex gap-3 text-xs">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 glass-input bg-slate-900 focus:outline-none"
          >
            <option value="">All Actions Categories</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Logs Table */}
      <section className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-3xs text-slate-500 uppercase border-b border-white/5 bg-slate-950/20">
              <tr>
                <th className="py-4 px-4">Timestamp</th>
                <th className="py-4 px-4">Trigger User</th>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Logs Details Description</th>
                <th className="py-4 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 px-4 font-mono text-2xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-200">
                      <div>{log.userName}</div>
                      <div className="text-3xs text-slate-500 uppercase font-semibold mt-0.5">{log.userRole}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-indigo-300">
                      {log.action}
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-4 px-4">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-2xs text-emerald-400 font-semibold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-2xs text-rose-400 font-semibold uppercase tracking-wider">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Anomaly
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
