import React, { useState, useEffect, useMemo } from 'react';
import { db, Certificate, User } from '../services/db';
import { TrendingUp, Award, Activity, AlertTriangle, ArrowUpRight, BarChart3, Users } from 'lucide-react';

export default function ExecutiveDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    // Filter by institution (multitenancy)
    const instId = user.institutionId || '';
    const certs = db.getCertificates().filter(c => user.role === 'admin' ? true : c.institutionId === instId);
    setCertificates(certs);
  }, []);

  const stats = useMemo(() => {
    const total = certificates.length;
    const active = certificates.filter(c => c.status === 'active').length;
    const suspended = certificates.filter(c => c.status === 'suspended').length;
    return { total, active, suspended };
  }, [certificates]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Executive Decision Dashboard</h1>
        <p className="text-sm text-slate-400">
          Executive operations summary for institutional leadership. Tracks credentialing volume, verification requests, and department performance.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Degrees Issued</span>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none flex items-center gap-1 font-sans">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +8.3%
            </span>
            vs last semester
          </div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Credentials</span>
              <div className="text-3xl font-bold text-emerald-400">{stats.active}</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none font-sans">Anchored in consensus block ledger</div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Suspensions</span>
              <div className="text-3xl font-bold text-amber-500">{stats.suspended}</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none font-sans">Locked pending verification reviews</div>
        </div>
      </div>

      {/* Overview charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Department performance Table */}
        <div className="lg:col-span-8 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <BarChart3 className="w-5 h-5 text-primary-light" />
            Department / Major Credentials Volume
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Department Name</th>
                  <th className="pb-3">Issued Count</th>
                  <th className="pb-3">Active Ratio</th>
                  <th className="pb-3 text-right pr-2">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/2 font-medium text-slate-300">
                  <td className="py-3 pl-2 text-white font-bold">Computer Science</td>
                  <td className="py-3">124</td>
                  <td className="py-3">99.2%</td>
                  <td className="py-3 text-right pr-2 text-emerald-400 font-bold">SECURE</td>
                </tr>
                <tr className="hover:bg-white/2 font-medium text-slate-300">
                  <td className="py-3 pl-2 text-white font-bold">Electrical Engineering</td>
                  <td className="py-3">85</td>
                  <td className="py-3">100%</td>
                  <td className="py-3 text-right pr-2 text-emerald-400 font-bold">SECURE</td>
                </tr>
                <tr className="hover:bg-white/2 font-medium text-slate-300">
                  <td className="py-3 pl-2 text-white font-bold">Mechanical Engineering</td>
                  <td className="py-3">62</td>
                  <td className="py-3">98.4%</td>
                  <td className="py-3 text-right pr-2 text-emerald-400 font-bold">SECURE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Alerts */}
        <div className="lg:col-span-4 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            Integrity Verification Requests
          </h2>

          <div className="space-y-4">
            <div className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white">Google HR Inc.</span>
                <p className="text-[10px] text-slate-500">Querying Alex Johnson BS degree</p>
              </div>
              <span className="text-[10px] text-slate-400">10m ago</span>
            </div>

            <div className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white">Stripe Payroll Core</span>
                <p className="text-[10px] text-slate-500">Querying Sarah Connor MS degree</p>
              </div>
              <span className="text-[10px] text-slate-400">2h ago</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple internal checkcircle icon wrapper
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
