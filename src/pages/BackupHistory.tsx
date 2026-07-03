import React, { useState, useEffect } from 'react';
import { db, BackupSnapshot, RecoveryLog } from '../services/db';
import { Database, FileText, CheckCircle2, ShieldCheck, Cpu, Clock } from 'lucide-react';

export default function BackupHistory() {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);

  useEffect(() => {
    setSnapshots(db.getBackupSnapshots());
    setRecoveryLogs(db.getRecoveryLogs());
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-sans">Snapshot & Recovery Logs</h1>
        <p className="text-sm text-slate-400">
          History of backup snapshots, encryption keys, and system rollback events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Snapshots Timeline */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Database className="w-5 h-5 text-primary-light" />
            Historical Backups History
          </h2>

          <div className="space-y-6 relative pl-6 border-l border-white/5">
            {snapshots.map(snap => (
              <div key={snap.id} className="relative space-y-2">
                {/* Node indicator */}
                <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block">{snap.id} ({snap.type.toUpperCase()})</span>
                    <p className="text-[10px] text-slate-500 font-mono">Date: {new Date(snap.timestamp).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {snap.size}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-mono space-y-1 text-slate-400 leading-normal">
                  <p><span className="text-slate-600">Checksum:</span> {snap.hash}</p>
                  <p><span className="text-slate-600">Cipher Key:</span> {snap.encryptionKey}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Logs */}
        <div className="lg:col-span-5 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Clock className="w-5 h-5 text-accent" />
            System Rollback & Recovery Audits
          </h2>

          <div className="space-y-4">
            {recoveryLogs.map(log => (
              <div key={log.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white font-mono">{log.snapshotId} Rollback</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                    {log.status}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">{log.details}</p>
                <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                  <span>Triggered by: {log.triggeredBy}</span>
                  <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {recoveryLogs.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No historical recovery rollback operations executed.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
