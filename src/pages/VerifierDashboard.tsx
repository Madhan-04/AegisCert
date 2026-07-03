import React, { useState, useEffect } from 'react';
import { db, Certificate } from '../services/db';
import { Search, Scan, FileText, CheckCircle2, AlertTriangle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface VerifierDashboardProps {
  navigate: (route: string) => void;
}

export default function VerifierDashboard({ navigate }: VerifierDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyHistory, setVerifyHistory] = useState<any[]>([]);

  useEffect(() => {
    // Get historical audits performed by verifiers
    const logs = db.getAuditLogs();
    const verifications = logs.filter(
      l => l.action === 'CREDENTIAL_VERIFIED' || l.action === 'CREDENTIAL_VERIFY_FAILED' || l.action === 'CREDENTIAL_TAMPERED'
    ).slice(0, 6);
    setVerifyHistory(verifications);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`verification?id=${searchQuery.trim()}`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Verifier Dashboard</h1>
        <p className="text-sm text-slate-400">Search the decentralised registry, scan printed credentials, and review your audit history.</p>
      </div>

      {/* Main Search Panel */}
      <section className="premium-card p-6 md:p-8 border border-white/10 relative overflow-hidden bg-slate-950/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              Decentralized Index Lookup
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify credentials instantly by querying their transaction hashes. Enter a Certificate ID, Roll Number, or Academic Registration Number below.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. CERT-2025-4819"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 premium-input text-sm"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95"
            >
              Verify Credential Hash
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="pt-4 flex flex-wrap gap-4 text-xs font-semibold">
            <button
              onClick={() => navigate('qr-scanner')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white rounded-xl flex items-center gap-2 transition-all"
            >
              <Scan className="w-4 h-4 text-indigo-400" />
              Scan Diploma QR Code
            </button>
            <button
              onClick={() => navigate('verification')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white rounded-xl flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-accent-light" />
              Manual Certificate Upload
            </button>
          </div>
        </div>
      </section>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Audit History list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="premium-card p-6 border border-white/5 space-y-6 bg-slate-950/40">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Your Verification History
              </h3>
              <span className="text-xs text-slate-500">Local lookup trail</span>
            </div>

            {verifyHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No credential verifications performed yet.
              </div>
            ) : (
              <div className="space-y-4">
                {verifyHistory.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex justify-between items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.details}</span>
                      </div>
                      <p className="text-slate-500 font-mono text-2xs">Audit Timestamp: {new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    
                    {item.status === 'success' ? (
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Tampered / Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Security Standards details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card p-6 border border-white/5 space-y-4 bg-slate-950/40">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Verification Guidelines
            </h3>
            
            <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">1. Cryptographic Audit</h4>
                <p>Ensure the provided Certificate ID matches the printed copy. Our system compares the calculated SHA-256 fingerprint with Ethereum logs.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">2. Tamper Warning</h4>
                <p>If the hash doesn't match the transaction receipt, our AI system immediately flags the credential as modified.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">3. Biometric Check</h4>
                <p>For high-security roles, request the candidate to perform a Mantra fingerprint biometrics check to verify identity ownership.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
