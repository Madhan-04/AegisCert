import React, { useState, useEffect } from 'react';
import { db, AuditLog } from '../services/db';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';

export default function Analytics() {
  const [fraudLogs, setFraudLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalCerts: 0,
    totalVerifications: 0,
    fraudAttempts: 0,
    approvedInsts: 0
  });

  useEffect(() => {
    const logs = db.getAuditLogs();
    const certs = db.getCertificates();
    const insts = db.getInstitutions();

    const verifications = logs.filter(l => l.action.startsWith('CREDENTIAL_VERIFIED')).length;
    const frauds = logs.filter(l => l.action === 'CREDENTIAL_TAMPERED' || l.action === 'LEDGER_TAMPERED').length;

    setStats({
      totalCerts: certs.length,
      totalVerifications: verifications + frauds + 4, // Including mock history count
      fraudAttempts: frauds,
      approvedInsts: insts.filter(i => i.status === 'approved').length
    });

    // Get fraud/anomaly logs
    const anomalies = logs.filter(
      l => l.action === 'CREDENTIAL_TAMPERED' || l.action === 'LOGIN_FAILED' || l.action === 'BIOMETRIC_MATCH_FAILED' || l.action === 'LEDGER_TAMPERED'
    );
    setFraudLogs(anomalies);
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Analytics</h1>
        <p className="text-sm text-slate-400">Monitor cryptographic transactions, monthly verification workloads, and AI fraud alerts.</p>
      </div>

      {/* Stats Grids */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-3xs uppercase font-bold text-slate-500">Scale</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{stats.totalCerts}</div>
            <div className="text-xs text-slate-400">Total Credentials Mined</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-3xs uppercase font-bold text-slate-500">Traffic</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{stats.totalVerifications}</div>
            <div className="text-xs text-slate-400">Verification Operations</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-3xs uppercase font-bold text-slate-500">Risk</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{stats.fraudAttempts}</div>
            <div className="text-xs text-slate-400">AI Fraud Anomalies Flagged</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-3xs uppercase font-bold text-slate-500">Trust</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{stats.approvedInsts}</div>
            <div className="text-xs text-slate-400">Accredited Nodes Online</div>
          </div>
        </div>
      </section>

      {/* SVG Graphs Split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Certificate Issuance chart */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">Monthly Certificate Issuance Trend</h3>
            <p className="text-2xs text-slate-400">Blockchain transactions volumes (thousands)</p>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {[45, 60, 50, 75, 90, 120].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative bg-slate-900 border border-white/5 rounded-t-lg overflow-hidden h-32 flex items-end">
                  <div 
                    style={{ height: `${(val / 120) * 100}%` }}
                    className="w-full bg-gradient-to-t from-primary to-accent group-hover:to-primary-light transition-all rounded-t-md"
                  />
                  {/* Tooltip on hover */}
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-3xs font-mono font-bold bg-slate-950 px-1 py-0.5 rounded text-white transition-opacity">
                    {val}k
                  </span>
                </div>
                <span className="text-3xs font-semibold text-slate-500 uppercase">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Verification chart */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">Verification Query Performance</h3>
            <p className="text-2xs text-slate-400">Successful matches vs. flagged exceptions</p>
          </div>

          <div className="h-48 relative pt-6 flex items-end justify-between">
            {/* Simple static SVG representing a line graph */}
            <svg className="absolute inset-x-0 bottom-6 h-36 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

              {/* Line path */}
              <path 
                d="M 0 80 Q 20 40 40 60 T 80 20 T 100 10" 
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              {/* Area path */}
              <path 
                d="M 0 80 Q 20 40 40 60 T 80 20 T 100 10 L 100 100 L 0 100 Z" 
                fill="url(#grad)" 
                opacity="0.08"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
              </defs>
            </svg>

            {/* Labels under graph */}
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => (
              <span key={idx} className="text-3xs font-semibold text-slate-500 uppercase relative z-10 w-full text-center">
                {month}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fraud/Anomaly logs list */}
      <section className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          AI Security Anomalies & Fraud Logs
        </h3>

        {fraudLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Zero security anomalies detected on the ledger. Smart contracts fully verified.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-3xs text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="py-3 px-2">Timestamp</th>
                  <th className="py-3 px-2">Trigger User</th>
                  <th className="py-3 px-2">Exception Type</th>
                  <th className="py-3 px-2">Diagnostics Details</th>
                  <th className="py-3 px-2 text-right">Audit Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fraudLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-rose-500/2 transition-colors">
                    <td className="py-4 px-2 font-mono text-2xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-2 font-bold text-slate-300">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-4 px-2 font-semibold text-rose-400 uppercase">
                      {log.action}
                    </td>
                    <td className="py-4 px-2 text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-4 px-2 text-right font-mono text-slate-600 font-bold">
                      {log.id.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
