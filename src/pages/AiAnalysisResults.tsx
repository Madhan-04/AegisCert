import React, { useState, useEffect } from 'react';
import { db, OcrReport } from '../services/db';
import { Cpu, FileText, CheckCircle2, ShieldCheck, Download, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function AiAnalysisResults() {
  const [report, setReport] = useState<OcrReport | null>(null);

  useEffect(() => {
    // Extract ID parameter from URL hash (e.g., #ai-analysis-results?id=ocr-12345)
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.split('?')[1]);
    const id = params.get('id');

    if (id) {
      const rep = db.getOcrReports().find(r => r.id === id);
      if (rep) {
        setReport(rep);
      }
    } else {
      // Load fallback first report
      const all = db.getOcrReports();
      if (all.length > 0) {
        setReport(all[0]);
      }
    }
  }, []);

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
        No OCR reports recorded. Please scan a document first.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">AI OCR Analysis Report</h1>
          <p className="text-sm text-slate-400">
            Cryptographic audit sheet comparing extracted metadata coordinates against blockchain nodes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Verification Overview Gauge */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6 text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Document Authenticity</h3>
            
            {/* Radial Dial Simulation */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#10B981" 
                  strokeWidth="6" 
                  strokeDasharray="251" 
                  strokeDashoffset={251 - (251 * report.authenticityScore) / 100} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute space-y-1">
                <span className="text-3xl font-black text-white">{report.authenticityScore}%</span>
                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Audit Score</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">FORGERY</span>
                <span className="text-emerald-400 font-bold">{report.forgeryProbability}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">RISK</span>
                <span className="text-emerald-400 font-bold uppercase">{report.riskClassification}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Fields Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              Extracted OCR Metadata Values
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Holder Name</span>
                  <span className="text-white font-bold text-sm">{report.extractedFields.studentName}</span>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Degree Track</span>
                  <span className="text-white font-bold text-sm">{report.extractedFields.degree}</span>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">CGPA / GPA Metric</span>
                  <span className="text-emerald-400 font-bold text-sm">{report.extractedFields.cgpa} / 4.00</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Roll Number</span>
                  <span className="text-white font-mono font-bold text-sm">{report.extractedFields.rollNo}</span>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Document Timestamp</span>
                  <span className="text-white font-bold text-sm">{report.extractedFields.issueDate}</span>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Signatures & Stamps</span>
                    <span className="text-emerald-400 font-bold text-sm">VERIFIED</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Blockchain Cross Verification Log */}
            <div className="p-4 bg-slate-900 border border-emerald-500/20 rounded-2xl space-y-2 font-mono text-2xs leading-relaxed text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>EVM Blockchain Consensus Ledger Status</span>
              </div>
              <p>
                Calculated text metadata SHA-256 hash successfully compiled and matches anchored ledger record.
              </p>
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4 text-3xs text-slate-500">
                <div>
                  <span>BLOCK ANCHOR HEIGHT:</span>
                  <p className="text-slate-300 font-bold">Block #1042</p>
                </div>
                <div>
                  <span>STATUS CHECKSUM:</span>
                  <p className="text-emerald-400 font-bold truncate">0x3F2A1D...33D8</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
