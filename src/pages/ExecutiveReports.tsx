import React, { useState } from 'react';
import { FileText, Cpu, Download, Settings, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ExecutiveReports() {
  const [reportType, setReportType] = useState('summary');
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeSoc, setIncludeSoc] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [readyReport, setReadyReport] = useState<string | null>(null);

  const handleCompile = (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    setReadyReport(null);
    setProgressMsg('Compiling audit logs and registration databases...');

    setTimeout(() => {
      setProgressMsg('Calculating Merkle root verification checksums...');
    }, 1200);

    setTimeout(() => {
      setProgressMsg('Signing report bundle using registrar public key...');
    }, 2400);

    setTimeout(() => {
      setCompiling(false);
      setReadyReport(`aegiscert_report_${reportType}_2026.pdf`);
      confetti({ particleCount: 60, spread: 50 });
    }, 3800);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Executive Report Center</h1>
        <p className="text-sm text-slate-400">
          Compile cryptographic audit worksheets and download exportable ledger files.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="premium-card border border-white/10 rounded-3xl p-6 md:p-8 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Sliders className="w-5 h-5 text-primary-light" />
            Report Compiler Configuration
          </h2>

          <form onSubmit={handleCompile} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Template Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2.5 premium-input text-xs bg-slate-900 focus:outline-none"
              >
                <option value="summary">Executive Summary Report</option>
                <option value="audit">Detailed Ledger Audit trail</option>
                <option value="security">Security & Incident SOC Report</option>
              </select>
            </div>

            {/* Inclusions */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Include Audit Data Fields</label>
              
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={includeLogs}
                    onChange={(e) => setIncludeLogs(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Include registration logs and issuance history</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={includeSoc}
                    onChange={(e) => setIncludeSoc(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Include SOC incident summaries and brute-force block logs</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              {compiling && (
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-3 text-xs font-mono text-indigo-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg}</span>
                </div>
              )}

              {readyReport && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center gap-4 animate-fadeIn">
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-white font-bold block">{readyReport}</span>
                      <p className="text-[10px] text-slate-500 font-mono">Digitally Signed Checksum: 0x3F2A1D...33D8</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Simulating file download: ${readyReport}`)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-2xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
              )}

              {!compiling && (
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-primary/20 hover:scale-[1.01]"
                >
                  Compile PDF Report
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
