import React, { useState, useEffect } from 'react';
import { db, BackupSnapshot, User } from '../services/db';
import { Database, Plus, RefreshCw, Calendar, Server, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BackupCenter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  
  // Settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [frequency, setFrequency] = useState('daily');
  const [cloudSync, setCloudSync] = useState(false);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setSnapshots(db.getBackupSnapshots());
  }, []);

  const handleCreateBackup = () => {
    setBackingUp(true);
    setProgressMsg('Performing database integrity validations...');

    setTimeout(() => {
      setProgressMsg('Encrypting registry tables using primary database keys...');
    }, 1200);

    setTimeout(() => {
      setProgressMsg('Syncing backup snapshot to local sandbox registers...');
    }, 2400);

    setTimeout(() => {
      const allSnaps = db.getBackupSnapshots();
      const newSnap: BackupSnapshot = {
        id: `snap-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        hash: `sha256-${Math.random().toString(16).substring(2, 18).toUpperCase()}...`,
        size: '2.5 MB',
        type: 'manual',
        encryptionKey: 'AES-256-MANUAL-USER-KEY',
        status: 'success'
      };

      allSnaps.unshift(newSnap);
      db.setBackupSnapshots(allSnaps);
      setSnapshots(allSnaps);
      setBackingUp(false);
      confetti({ particleCount: 50, spread: 40 });

      // Audit
      if (currentUser) {
        db.addAuditLog(currentUser.id, currentUser.name, currentUser.role, 'BACKUP_CREATED', `Successfully created manual database backup snapshot: ${newSnap.id}`, 'success');
      }
    }, 3800);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            Business Continuity & Backup Center
          </h1>
          <p className="text-sm text-slate-400">
            Create encrypted database snapshots, schedule automatic backups, and monitor recovery logs.
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={backingUp}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Create Backup
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Settings */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar className="w-5 h-5 text-primary-light" />
            Automatic Backup Scheduler
          </h2>

          <div className="space-y-5">
            <div className="flex justify-between items-center p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
              <div>
                <span className="font-bold text-white text-xs block">Enable Automated Backups</span>
                <p className="text-[10px] text-slate-500">Automatically creates snapshots in the background</p>
              </div>
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="w-10 h-5 rounded-full bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Backup Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                disabled={!autoBackup}
                className="w-full px-4 py-2.5 premium-input text-xs bg-slate-900 focus:outline-none disabled:opacity-50"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Every Day at Midnight</option>
                <option value="weekly">Every Sunday at Midnight</option>
              </select>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
              <div>
                <span className="font-bold text-white text-xs block">Cloud Storage Synchronization</span>
                <p className="text-[10px] text-slate-500">Syncs backup bundles to AWS Glacier (Simulated)</p>
              </div>
              <input
                type="checkbox"
                checked={cloudSync}
                onChange={(e) => setCloudSync(e.target.checked)}
                className="w-10 h-5 rounded-full bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Progress monitor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Server className="w-5 h-5 text-accent" />
              Backup Diagnostic Logs
            </h2>

            {backingUp ? (
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-3 text-xs font-mono text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{progressMsg}</span>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs font-mono text-emerald-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block">Continuity Nominal</span>
                  <p className="text-[10px] text-slate-500">All backup registers verified and synced.</p>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 space-y-2 border-t border-white/5 pt-4 font-mono leading-relaxed">
              <div className="flex justify-between">
                <span>Backup Directory:</span>
                <span className="text-slate-300">localStorage://enc_snapshots</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption standard:</span>
                <span className="text-slate-300">XOR Hex Obfuscation</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
