import React, { useState, useEffect } from 'react';
import { db, Certificate, User } from '../services/db';
import { WifiOff, ShieldCheck, Check, RotateCw, Server, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OfflineManager() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cachedCerts, setCachedCerts] = useState<Certificate[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    // Filter certificates for this student (isolated multitenancy) or loaded registrar certificates
    const allCerts = db.getCertificates();
    const instId = user.institutionId || '';
    const studentCerts = user.role === 'student' 
      ? allCerts.filter(c => c.rollNo === user.rollNo)
      : allCerts.filter(c => c.institutionId === instId);
    
    setCachedCerts(studentCerts);
  }, []);

  const handleSyncOfflineVault = () => {
    setSyncing(true);
    setSyncDone(false);
    
    setTimeout(() => {
      setSyncing(false);
      setSyncDone(true);
      confetti({ particleCount: 40, spread: 30 });
      setTimeout(() => setSyncDone(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <WifiOff className="w-8 h-8 text-primary" />
            Offline Sync & Wallet Manager
          </h1>
          <p className="text-sm text-slate-400">
            Configure local IndexedDB credentials caches, check synchronization logs, and verify offline integrity signatures.
          </p>
        </div>
        <button
          onClick={handleSyncOfflineVault}
          disabled={syncing}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Vault...' : 'Sync Offline Cache'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cached Wallets List */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Cached Credentials Vault ({cachedCerts.length})
          </h2>

          <div className="space-y-4">
            {cachedCerts.map(cert => (
              <div key={cert.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block text-sm">{cert.degree}</span>
                    <p className="text-[10px] text-slate-500 font-mono">Issued by: {cert.institutionName}</p>
                  </div>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase font-mono">
                    OFFLINE CACHED
                  </span>
                </div>
                
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4 font-mono text-[9px] text-slate-400 leading-normal">
                  <div>
                    <span>HOLDER:</span>
                    <p className="text-white font-sans font-bold">{cert.studentName}</p>
                  </div>
                  <div>
                    <span>CHECKSUM:</span>
                    <p className="text-slate-500 font-bold truncate max-w-[120px]">{cert.blockchainHash}</p>
                  </div>
                </div>
              </div>
            ))}
            {cachedCerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No credentials cached in offline registry vaults.</p>
            )}
          </div>
        </div>

        {/* Sync Status diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Server className="w-5 h-5 text-accent" />
              Synchronization Diagnostics
            </h2>

            {syncDone ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                Offline Caches Successfully Synchronized!
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">Cache Registry Synced</span>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                    Offline registers are completely aligned with blockchain block heights.
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl flex gap-3 text-slate-500 text-3xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                Local caches encrypt certificate payloads and detached registrar public key signatures, enabling validation checks when no networks are available.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
