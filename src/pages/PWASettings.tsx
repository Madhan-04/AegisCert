import React, { useState } from 'react';
import { Smartphone, Download, Settings, RefreshCw, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PWASettings() {
  const [swStatus, setSwStatus] = useState('active');
  const [cacheSize, setCacheSize] = useState('12.4 MB');
  const [syncStatus, setSyncStatus] = useState(true);
  
  // Install states
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleSimulateInstall = () => {
    setInstalling(true);
    setTimeout(() => {
      setInstalling(false);
      setInstalled(true);
      confetti({ particleCount: 60, spread: 50 });
    }, 1500);
  };

  const handleClearCache = () => {
    setCacheSize('0.0 KB');
    setTimeout(() => setCacheSize('12.4 MB'), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Mobile PWA Console</h1>
        <p className="text-sm text-slate-400">
          Monitor service worker caching parameters, trigger application installs, and evaluate background syncing diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Diagnostics */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Smartphone className="w-5 h-5 text-primary-light" />
            Service Worker Diagnostic Parameters
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
              <div>
                <span className="font-bold text-white block">Service Worker Registration</span>
                <p className="text-[10px] text-slate-500 font-mono">Scope: root / local-cache-sandbox</p>
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                ACTIVE
              </span>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
              <div>
                <span className="font-bold text-white block">Pre-Cached Storage Allocation</span>
                <p className="text-[10px] text-slate-500">Total size of images, CSS, and JS chunks cached offline</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-white font-mono">{cacheSize}</span>
                <button
                  onClick={handleClearCache}
                  className="px-2.5 py-1.5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-lg text-2xs transition-all active:scale-95"
                >
                  Clear Caches
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
              <div>
                <span className="font-bold text-white block">Background Data Sync</span>
                <p className="text-[10px] text-slate-500">Uploads offline verifications automatically when re-connected</p>
              </div>
              <input
                type="checkbox"
                checked={syncStatus}
                onChange={(e) => setSyncStatus(e.target.checked)}
                className="w-10 h-5 rounded-full bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Installation controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6 text-center">
            <Smartphone className="w-12 h-12 text-primary mx-auto animate-bounce" />
            <div>
              <h3 className="text-base font-bold text-white">Install AegisCert App</h3>
              <p className="text-2xs text-slate-400 leading-relaxed mt-1">
                Install AegisCert to your desktop or mobile home screen for zero-latency startup and offline-ready credential access.
              </p>
            </div>

            <div className="pt-2">
              {installed ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  INSTALLED
                </div>
              ) : (
                <button
                  onClick={handleSimulateInstall}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  disabled={installing}
                >
                  <Download className={`w-3.5 h-3.5 ${installing ? 'animate-bounce' : ''}`} />
                  {installing ? 'Installing Sandbox PWA...' : 'Install Web App'}
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-900/30 border border-white/5 rounded-2xl flex gap-3 text-slate-500 text-left text-3xs leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                AegisCert operates as a Progressive Web App (PWA), supporting service worker caching layers to permit complete offline functionality.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
