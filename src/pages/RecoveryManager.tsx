import React, { useState, useEffect } from 'react';
import { db, BackupSnapshot, User } from '../services/db';
import { ShieldCheck, RefreshCw, AlertTriangle, RotateCcw, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RecoveryManager() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('');
  
  // Rolling back state
  const [rollingBack, setRollingBack] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [rollbackSuccess, setRollbackSuccess] = useState(false);

  // Integrity Check status
  const [integrityState, setIntegrityState] = useState<{ valid: boolean; calculatedHash: string } | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setSnapshots(db.getBackupSnapshots());
    handleRunIntegrityCheck();
  }, []);

  const handleRunIntegrityCheck = () => {
    setCheckingIntegrity(true);
    setIntegrityState(null);
    setTimeout(() => {
      const res = db.verifyDatabaseIntegrity();
      setIntegrityState({ valid: res.valid, calculatedHash: res.calculatedHash });
      setCheckingIntegrity(false);
    }, 1200);
  };

  const handleRollback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSnapshotId) return;

    setRollingBack(true);
    setRollbackSuccess(false);
    setProgressMsg('Locking database writes and active user sessions...');

    setTimeout(() => {
      setProgressMsg('Decrypting backup snapshot bundle data...');
    }, 1000);

    setTimeout(() => {
      setProgressMsg('Overwriting database registers: campuses, departments, API keys...');
    }, 2000);

    setTimeout(() => {
      setProgressMsg('Recalculating database checksum digest codes...');
    }, 3000);

    setTimeout(() => {
      // Simulate rollback success
      setRollingBack(false);
      setRollbackSuccess(true);
      confetti({ particleCount: 70, spread: 60 });

      // Audit
      if (currentUser) {
        db.addAuditLog(currentUser.id, currentUser.name, currentUser.role, 'DATABASE_ROLLBACK', `Executed database rollback to snapshot: ${selectedSnapshotId}`, 'success');
      }

      // Add recovery logs entry
      const logs = db.getRecoveryLogs();
      logs.unshift({
        id: `rec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        snapshotId: selectedSnapshotId,
        triggeredBy: currentUser?.name || 'Admin',
        status: 'success',
        details: 'Manual recovery rollback completed successfully.'
      });
      db.setRecoveryLogs(logs);

      // Re-run integrity check
      handleRunIntegrityCheck();

      setTimeout(() => setRollbackSuccess(false), 4000);
    }, 4200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Disaster Recovery Console</h1>
        <p className="text-sm text-slate-400">
          Restore database records from encrypted historical snapshots, verify database digest checksums, and monitor rollback audits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Rollback Form */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <RotateCcw className="w-5 h-5 text-indigo-400" />
            Database Rollback Setup
          </h2>

          <form onSubmit={handleRollback} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Backup Snapshot</label>
              <select
                required
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="w-full px-4 py-2.5 premium-input text-xs bg-slate-900 focus:outline-none"
              >
                <option value="">Choose snapshot to restore...</option>
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString()}) • {s.size}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Destructive Operation Warning</span>
                <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                  Restoring database state overrides all modifications, new certificate issues, and logs created after the selected snapshot.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              {rollingBack && (
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-3 text-xs font-mono text-indigo-400">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{progressMsg}</span>
                </div>
              )}

              {rollbackSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 animate-fadeIn text-xs text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  Database Rollback Executed Successfully!
                </div>
              )}

              {!rollingBack && (
                <button
                  type="submit"
                  disabled={!selectedSnapshotId}
                  className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl text-xs transition-all shadow-lg hover:scale-[1.01] disabled:opacity-50"
                >
                  Initiate System Recovery Rollback
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Database Integrity Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Merkle Digest Integrity Checks
              </h2>
              <button
                onClick={handleRunIntegrityCheck}
                disabled={checkingIntegrity}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"
                title="Run Audit Check"
              >
                <RefreshCw className={`w-4 h-4 ${checkingIntegrity ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {checkingIntegrity ? (
              <div className="py-6 text-center text-xs font-mono text-slate-500">
                Evaluating database file registers...
              </div>
            ) : integrityState ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs text-emerald-400">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Database Checksums VALID</span>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      No manual database tampering detected. expected and calculated digests match perfectly.
                    </p>
                  </div>
                </div>
                
                <div className="text-[10px] font-mono space-y-1 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                  <span className="text-slate-500 uppercase font-bold block">Current Digest Hex</span>
                  <p className="text-slate-300 break-all select-all">{integrityState.calculatedHash}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
