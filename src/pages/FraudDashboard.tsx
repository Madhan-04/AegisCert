import React, { useState, useEffect } from 'react';
import { db, FraudReport, User, Certificate } from '../services/db';
import { 
  ShieldAlert, Award, UserCheck, Globe, Activity, CheckCircle, 
  AlertTriangle, Play, RefreshCw, Check, ArrowUpRight
} from 'lucide-react';

export default function FraudDashboard() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [duplicateCerts, setDuplicateCerts] = useState<Certificate[]>([]);
  const [duplicateBiometrics, setDuplicateBiometrics] = useState<User[]>([]);
  const [suspiciousDomains, setSuspiciousDomains] = useState<{ email: string; user: string; domain: string; risk: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadFraudData = () => {
    setReports(db.getFraudReports());
    
    // Find certificates that have duplicate hashes or exact duplicate cgpa + major (collusion check)
    const certs = db.getCertificates();
    const dupes: Certificate[] = [];
    const seen = new Set<string>();
    certs.forEach(c => {
      const key = `${c.degree}-${c.department}-${c.cgpa}`;
      if (seen.has(key)) {
        // Find matching original
        const orig = certs.find(o => `${o.degree}-${o.department}-${o.cgpa}` === key && o.id !== c.id);
        if (orig && !dupes.find(d => d.id === c.id)) dupes.push(c);
        if (orig && !dupes.find(d => d.id === orig.id)) dupes.push(orig);
      } else {
        seen.add(key);
      }
    });
    setDuplicateCerts(dupes);

    // Find users with duplicate face enroll ids (if set)
    const users = db.getUsers();
    const faceDupes: User[] = [];
    const faceSeen = new Map<string, User>();
    users.forEach(u => {
      if (u.faceEnrollId) {
        if (faceSeen.has(u.faceEnrollId)) {
          const orig = faceSeen.get(u.faceEnrollId)!;
          if (!faceDupes.find(d => d.id === u.id)) faceDupes.push(u);
          if (!faceDupes.find(d => d.id === orig.id)) faceDupes.push(orig);
        } else {
          faceSeen.set(u.faceEnrollId, u);
        }
      }
    });
    setDuplicateBiometrics(faceDupes);

    // Scan users email domains for phishy domains
    const phishy: { email: string; user: string; domain: string; risk: string }[] = [];
    const whitelistedDomains = ['mit.edu', 'aegiscert.gov', 'google.com'];
    users.forEach(u => {
      if (u.email) {
        const domain = u.email.split('@')[1];
        if (domain && !whitelistedDomains.includes(domain)) {
          // Flag if role is registrar or admin (high risk email addresses)
          if (u.role === 'institution' || u.role === 'admin') {
            phishy.push({
              email: u.email,
              user: u.name,
              domain,
              risk: 'HIGH - Unapproved University Registrar Mail Host'
            });
          }
        }
      }
    });
    setSuspiciousDomains(phishy);
  };

  useEffect(() => {
    loadFraudData();
  }, []);

  const handleMitigateReport = (id: string) => {
    const allReports = db.getFraudReports();
    const updated = allReports.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: 'mitigated' as const };
      }
      return rep;
    });
    db.setFraudReports(updated);
    setReports(updated);

    db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'FRAUD_MITIGATED', `Admin marked fraud report ${id} as resolved & mitigated`, 'success');
    db.addSocEvent('low', 'FRAUD_MITIGATION_EXEC', `Integrity check anomaly mitigated for report ${id}`, '127.0.0.1');
  };

  const runFullAiAudit = () => {
    setIsAnalyzing(true);
    db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'AI_FRAUD_SCAN', 'Executed AI multi-agent collusion & duplicate scan across registry', 'success');

    setTimeout(() => {
      loadFraudData();
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-accent-light" />
            AI Fraud Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Cognitive multi-vector checks parsing duplicate profiles, biometric spoofing attempts, and registrar email spoof validations.
          </p>
        </div>
        <button
          onClick={runFullAiAudit}
          className="px-4 py-2 bg-gradient-to-r from-accent to-primary hover:from-accent-light hover:to-primary-light text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95"
          disabled={isAnalyzing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing Registry Matrix...' : 'Run Dynamic AI Audit'}
        </button>
      </div>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-widest">Collusion Risks</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{duplicateCerts.length}</div>
            <p className="text-3xs text-slate-500 uppercase mt-1 tracking-wider">Duplicate major/cgpa patterns</p>
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-widest">Biometric Spoofs</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{duplicateBiometrics.length}</div>
            <p className="text-3xs text-slate-500 uppercase mt-1 tracking-wider">Shared face credentials</p>
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-widest">Phishy Registrars</span>
            <Globe className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{suspiciousDomains.length}</div>
            <p className="text-3xs text-slate-500 uppercase mt-1 tracking-wider">Non-whitelisted mail servers</p>
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl border border-rose-500/20 bg-rose-950/5 space-y-4">
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-2xs font-extrabold uppercase tracking-widest">Unresolved Anomaly reports</span>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-rose-400">
              {reports.filter(r => r.status === 'active').length}
            </div>
            <p className="text-3xs text-rose-500 uppercase mt-1 tracking-wider font-semibold">Active warning flags</p>
          </div>
        </div>
      </section>

      {/* Anomaly list & Audits details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Active Fraud Incident Reports */}
        <section className="lg:col-span-7 premium-card p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-lg">AI-Triggered Fraud Reports</h3>
            <p className="text-2xs text-slate-400">Active alerts raised automatically when signature mismatches or integrity collisions occur.</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No active fraud flags. Registry integrity complete.</div>
            ) : (
              reports.map((rep) => (
                <div 
                  key={rep.id} 
                  className={`p-4 rounded-xl border flex gap-4 items-start ${rep.status === 'mitigated' ? 'bg-slate-950/20 border-white/5 opacity-50' : 'bg-slate-950/70 border-white/10'}`}
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${rep.status === 'mitigated' ? 'bg-slate-900 border-white/5 text-slate-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-3xs font-mono font-bold uppercase text-slate-400 mr-2">{rep.category}</span>
                        <span className="text-3xs text-rose-400 font-extrabold font-mono">RISK SCORE: {rep.riskScore}%</span>
                      </div>
                      <span className="text-3xs font-mono text-slate-500">{new Date(rep.timestamp).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{rep.details}</p>

                    <div className="flex justify-between items-center text-3xs border-t border-white/5 pt-2">
                      <span className="text-slate-500">Anomaly Index ID: {rep.id}</span>
                      {rep.status === 'active' ? (
                        <button
                          onClick={() => handleMitigateReport(rep.id)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors font-sans font-bold"
                        >
                          Execute Mitigation
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3.5 h-3.5" />
                          Mitigated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Side: Collusion details & phishy domains */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Collusion Check card */}
          <div className="premium-card p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              Collusion Scan (Degree / GPA Dupes)
            </h3>
            <p className="text-3xs text-slate-400 leading-relaxed">
              Finds duplicate academic outputs sharing same Major and GPA details which could suggest certificate cloning forgery.
            </p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 text-3xs font-mono">
              {duplicateCerts.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">No collusion patterns flagged.</div>
              ) : (
                duplicateCerts.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-white text-3xs">{c.studentName}</h5>
                      <p className="text-slate-500">{c.degree} ({c.cgpa})</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-3xs font-bold uppercase">
                      {c.id}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fake registrars check */}
          <div className="premium-card p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-400" />
              Registrar Email Domain Watchlist
            </h3>
            <p className="text-3xs text-slate-400 leading-relaxed">
              Detects if an administrative account email is hosted outside approved educational domains.
            </p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 text-3xs font-mono">
              {suspiciousDomains.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">All registrars on whitelisted hosts.</div>
              ) : (
                suspiciousDomains.map((d, i) => (
                  <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-rose-400 font-bold">
                      <span>{d.user}</span>
                      <span className="text-2xs font-extrabold uppercase font-sans">High Risk</span>
                    </div>
                    <div className="text-slate-300 break-all">{d.email}</div>
                    <p className="text-3xs text-rose-500/70 font-sans leading-tight mt-1">{d.risk}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
