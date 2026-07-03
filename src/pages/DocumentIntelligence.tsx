import React, { useState, useEffect } from 'react';
import { db, OcrReport } from '../services/db';
import { Cpu, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Eye } from 'lucide-react';

interface DocumentIntelligenceProps {
  navigate: (route: string) => void;
}

export default function DocumentIntelligence({ navigate }: DocumentIntelligenceProps) {
  const [reports, setReports] = useState<OcrReport[]>([]);

  useEffect(() => {
    setReports(db.getOcrReports());
  }, []);

  const stats = React.useMemo(() => {
    const total = reports.length;
    const avgScore = total 
      ? Math.round(reports.reduce((sum, r) => sum + r.authenticityScore, 0) / total) 
      : 0;
    const alertCount = reports.filter(r => r.riskClassification === 'high').length;
    return { total, avgScore, alertCount };
  }, [reports]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-8 h-8 text-primary" />
            AegisAI Document Intelligence
          </h1>
          <p className="text-sm text-slate-400">
            AI-powered document OCR scanning, signature verification, stamp analysis, and blockchain cross-audits.
          </p>
        </div>
        <button
          onClick={() => navigate('document-scanner')}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          Launch AI Scanner
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documents Parsed</span>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none font-medium">Diplomas and academic transcripts</div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Authenticity</span>
              <div className="text-3xl font-bold text-emerald-400">{stats.avgScore}%</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none font-medium">Weighted signature & seal confidence</div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forgery Flags</span>
              <div className="text-3xl font-bold text-rose-400">{stats.alertCount}</div>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none font-medium">Critical discrepancies flagged by AI</div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          OCR Processing Registry
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Upload Date</th>
                <th className="pb-3">File Name</th>
                <th className="pb-3">Candidate</th>
                <th className="pb-3">OCR Confidence</th>
                <th className="pb-3">Risk Assessment</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map(rep => (
                <tr key={rep.id} className="hover:bg-white/2 font-medium text-slate-300">
                  <td className="py-3 pl-2 text-slate-500">{new Date(rep.timestamp).toLocaleDateString()}</td>
                  <td className="py-3 text-white font-bold">{rep.fileName}</td>
                  <td className="py-3">{rep.extractedFields.studentName}</td>
                  <td className="py-3 font-mono text-indigo-400">{rep.confidenceScore}%</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      rep.riskClassification === 'low' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {rep.riskClassification === 'low' ? 'Clear Safe' : 'Suspected'}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => navigate(`ai-analysis-results?id=${rep.id}`)}
                      className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-2xs font-semibold flex items-center gap-1 transition-all active:scale-95 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      View Audit Sheet
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents parsed in the session. Click "Launch AI Scanner" to analyze certificates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
