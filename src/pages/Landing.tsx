import React, { useState } from 'react';
import { Shield, Cpu, ScanLine, Award, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { db } from '../services/db';
import AntigravityBackground from '../components/AntigravityBackground';

interface LandingProps {
  navigate: (route: string) => void;
}

export default function Landing({ navigate }: LandingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickVerifyResult, setQuickVerifyResult] = useState<{
    searched: boolean;
    found: boolean;
    name?: string;
    degree?: string;
    institution?: string;
    status?: 'draft' | 'pending' | 'issued' | 'active' | 'suspended' | 'revoked' | 'expired';
  } | null>(null);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const certs = db.getCertificates();
    const found = certs.find(
      (c) =>
        c.id.toLowerCase() === searchQuery.trim().toLowerCase() ||
        c.rollNo.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (found) {
      setQuickVerifyResult({
        searched: true,
        found: true,
        name: found.studentName,
        degree: found.degree,
        institution: found.institutionName,
        status: found.status,
      });
      // Add audit log for anonymous lookup
      db.addAuditLog('anonymous', 'Anonymous Verifier', 'verifier', 'CREDENTIAL_VERIFIED', `Quick verified certificate ${found.id} on landing page`, 'success');
    } else {
      setQuickVerifyResult({
        searched: true,
        found: false,
      });
      db.addAuditLog('anonymous', 'Anonymous Verifier', 'verifier', 'CREDENTIAL_VERIFY_FAILED', `Failed quick verification search for "${searchQuery}"`, 'failure');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-darkBg text-slate-100 cyber-grid">
      <AntigravityBackground />
      {/* Background Glow Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-primary/20 top-[-10%] left-[-10%]" />
      <div className="glow-orb w-[600px] h-[600px] bg-secondary/15 bottom-[-10%] right-[-10%]" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent/10 top-[40%] left-[30%]" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('landing')}>
          <img src="/logo.jpg" className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-primary/20 border border-white/10" />
          <span className="text-xl md:text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-primary-light">
            AEGIS<span className="text-accent font-light">CERT</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button onClick={() => navigate('landing')} className="hover:text-white transition-colors">Home</button>
          <button onClick={() => navigate('about')} className="hover:text-white transition-colors">About</button>
          <button onClick={() => navigate('features')} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => navigate('verification')} className="hover:text-white transition-colors">Verification Portal</button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('login')}
            className="px-5 py-2 text-sm font-semibold glass-panel hover:bg-white/5 border border-white/10 rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('register')}
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-white rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary-light tracking-wide animate-pulse">
            <Cpu className="w-3.5 h-3.5" />
            Decentralized Credential Ledger v1.4
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            The Future of <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-light via-indigo-300 to-accent-light">
              Academic Credential
            </span> <br />
            Verification.
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0">
            A secure, tamper-proof, and instant verification network utilizing Ethereum smart contracts, cryptographic document hashing, and biometric identity protection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => navigate('register')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105"
            >
              Register Institution
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('verification')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 glass-panel border border-white/10 hover:bg-white/5 font-semibold rounded-xl transition-all"
            >
              Verify Credentials
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5 max-w-md mx-auto lg:mx-0">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Immutable</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-primary-light">0.8s</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Verification</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-accent-light">Zero</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Paperwork</div>
            </div>
          </div>
        </div>

        {/* Verification Card on Right */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[24px] filter blur-2xl opacity-50" />
          <div className="relative premium-card p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/15 rounded-lg text-accent-light">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Instant Verification</h3>
                  <p className="text-xs text-slate-400">Search blockchain index</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Node
              </span>
            </div>

            <form onSubmit={handleQuickVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Certificate ID / Student Roll Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CERT-2025-4819"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2.5 premium-input text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Query
                  </button>
                </div>
              </div>
            </form>

            {/* Quick verification results */}
            {quickVerifyResult && (
              <div className="mt-4 p-4 rounded-xl border animate-fadeIn bg-slate-900/60 backdrop-blur-md border-white/5">
                {quickVerifyResult.found ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{quickVerifyResult.name}</h4>
                        <p className="text-xs text-slate-400">{quickVerifyResult.degree} • {quickVerifyResult.institution}</p>
                      </div>
                      {quickVerifyResult.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Secured via Smart Contract</span>
                      <button
                        onClick={() => navigate('verification')}
                        className="text-accent-light hover:underline font-semibold flex items-center gap-1"
                      >
                        Deep Audit
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Record Not Found</h4>
                      <p className="text-xs text-slate-400">This credential hash is not registered on the blockchain network ledger. Verify the ID and try again.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

       {/* Info Sections */}
      <section className="relative z-10 py-16 border-t border-white/5 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="premium-card p-6 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Immutable Blockchain Ledgers</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Certificate signatures and student detail hashes are written directly to Ethereum block transactions, making credentials permanent and impossible to forge.
            </p>
          </div>

          <div className="premium-card p-6 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-light">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dual-Factor Session Shield</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Secure ledger access with personal 6-digit MPIN credentials and physical Mantra MFS100 fingerprint sensors. Defends against session hijacking and credentials theft.
            </p>
          </div>

          <div className="premium-card p-6 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary-light">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Enterprise Audit Shield</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Maintain an active cryptographic registry of credential lookups, revocations, and system actions. Instantly detects database sync mismatches.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} AegisCert Network. All Rights Reserved. Built with Ethereum Smart Contracts.
        </div>
        <div className="flex gap-6">
          <button onClick={() => navigate('about')} className="hover:text-slate-300">Architecture</button>
          <button onClick={() => navigate('features')} className="hover:text-slate-300">Security Parameters</button>
          <button onClick={() => navigate('support')} className="hover:text-slate-300">Technical Support</button>
        </div>
      </footer>
    </div>
  );
}
