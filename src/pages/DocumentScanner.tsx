import React, { useState, useEffect } from 'react';
import { db, OcrReport } from '../services/db';
import { Cpu, Upload, FileText, CheckCircle2, ShieldCheck, CornerDownRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DocumentScannerProps {
  navigate: (route: string) => void;
}

export default function DocumentScanner({ navigate }: DocumentScannerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stepMsg, setStepMsg] = useState('');
  const [highlightBoxes, setHighlightBoxes] = useState<string[]>([]);

  const handleSelectSample = () => {
    setSelectedFile('Alex_Johnson_Diploma.pdf');
  };

  const handleStartScan = () => {
    if (!selectedFile) return;
    setScanning(true);
    setHighlightBoxes([]);

    // Scanning steps
    setStepMsg('Extracting textual metadata structures via neural OCR...');
    
    setTimeout(() => {
      setHighlightBoxes(prev => [...prev, 'metadata']);
      setStepMsg('Detecting authentic branding logo stamp...');
    }, 1200);

    setTimeout(() => {
      setHighlightBoxes(prev => [...prev, 'logo']);
      setStepMsg('Validating official security wax seal stamp vectors...');
    }, 2400);

    setTimeout(() => {
      setHighlightBoxes(prev => [...prev, 'seal']);
      setStepMsg('Analyzing registrar signature minutiae...');
    }, 3600);

    setTimeout(() => {
      setHighlightBoxes(prev => [...prev, 'signature']);
      setStepMsg('Cross-validating document checksum on EVM blockchain ledger...');
    }, 4800);

    setTimeout(() => {
      // Create Mock OCR report
      const newId = `ocr-${Math.floor(100000 + Math.random() * 900000)}`;
      const newReport: OcrReport = {
        id: newId,
        timestamp: new Date().toISOString(),
        fileName: selectedFile,
        fileSize: '1.4 MB',
        authenticityScore: 99.4,
        forgeryProbability: 0.6,
        confidenceScore: 98.2,
        riskClassification: 'low',
        extractedFields: {
          studentName: 'Alex Johnson',
          rollNo: 'MIT-2024-082',
          degree: 'Bachelor of Science',
          cgpa: '3.91',
          issueDate: '2026-06-21',
          signatureFound: true,
          sealFound: true
        }
      };

      const allReports = db.getOcrReports();
      allReports.unshift(newReport);
      db.setOcrReports(allReports);

      // Audit logs
      const user = db.getCurrentUser();
      if (user) {
        db.addAuditLog(user.id, user.name, user.role, 'AI_DOCUMENT_SCANNED', `Scanned and verified certificate document: ${selectedFile}`, 'success');
      }

      confetti({ particleCount: 80, spread: 60 });
      setScanning(false);
      navigate(`ai-analysis-results?id=${newId}`);
    }, 6200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Interactive AI Document Scanner</h1>
        <p className="text-sm text-slate-400">
          Upload certificate PDFs or transcripts to run real-time OCR metadata parses and signature verification overlays.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="premium-card border border-white/10 rounded-3xl p-6 md:p-8 bg-slate-950/40 space-y-6 relative overflow-hidden">
          {scanning && <div className="scan-line" />}

          {!selectedFile && (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-4 hover:border-primary/40 transition-colors flex flex-col items-center">
              <Upload className="w-12 h-12 text-slate-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white">Drag & Drop Credentials File</h3>
                <p className="text-2xs text-slate-500 mt-1">Accepts high-resolution diploma scans, JPG, PNG, or PDF formats.</p>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleSelectSample}
                  className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-2xs font-semibold transition-all active:scale-95"
                >
                  Load Sample Certificate
                </button>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="space-y-6">
              {/* Loaded Mock Certificate Layout */}
              <div className="relative border border-white/5 rounded-2xl p-6 bg-slate-900/40 min-h-[320px] flex flex-col justify-between overflow-hidden">
                {/* Top: Logo & Title */}
                <div className="flex justify-between items-start">
                  <div className={`flex items-center gap-2 p-1.5 rounded transition-all duration-300 ${
                    highlightBoxes.includes('logo') ? 'bg-indigo-500/10 border border-indigo-500/30' : ''
                  }`}>
                    <img src="/logo.jpg" className="w-8 h-8 rounded object-cover border border-white/10" />
                    <div>
                      <h4 className="text-white text-xs font-bold leading-none">Massachusetts Institute of Technology</h4>
                      <span className="text-[7px] text-slate-500">FEDERATION REGISTER NODE</span>
                    </div>
                  </div>
                  
                  <div className={`p-1 border border-white/5 rounded transition-all duration-300 ${
                    highlightBoxes.includes('seal') ? 'bg-amber-500/10 border-amber-500/30' : ''
                  }`}>
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                {/* Middle: Student credentials */}
                <div className={`my-6 space-y-2 p-3 rounded transition-all duration-300 ${
                  highlightBoxes.includes('metadata') ? 'bg-emerald-500/10 border border-emerald-500/30' : ''
                }`}>
                  <span className="text-[8px] text-slate-500 block uppercase">Student Holder Name:</span>
                  <h3 className="text-md font-bold text-white">Alex Johnson</h3>
                  <p className="text-[10px] text-slate-400">
                    Degree of Bachelor of Science in Computer Science (GPA: 3.91)
                  </p>
                </div>

                {/* Bottom: Signature & Checksum */}
                <div className="flex justify-between items-end border-t border-white/5 pt-4 text-[7px] font-mono text-slate-500">
                  <div>
                    <span>LEDGER CHECKSUM</span>
                    <p className="text-slate-400 font-bold truncate max-w-[100px]">0x3F2A1D...33D8</p>
                  </div>
                  <div className={`p-1 rounded text-right transition-all duration-300 ${
                    highlightBoxes.includes('signature') ? 'bg-indigo-500/10 border border-indigo-500/30' : ''
                  }`}>
                    <div className="text-white font-sans italic text-2xs mb-0.5 border-b border-slate-700 pb-0.5">Registrar Signature</div>
                    <span>AUTHORIZED SIGNER</span>
                  </div>
                </div>
              </div>

              {/* Action and Diagnostics */}
              <div className="space-y-4">
                {scanning && (
                  <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3 font-mono text-xs">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Cpu className="w-4 h-4 animate-spin" />
                      <span>{stepMsg}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setScanning(false);
                      setHighlightBoxes([]);
                    }}
                    className="flex-1 py-3 premium-btn-secondary text-xs font-semibold"
                    disabled={scanning}
                  >
                    Clear File
                  </button>
                  
                  {!scanning && (
                    <button
                      onClick={handleStartScan}
                      className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
                    >
                      Audit with AegisAI OCR
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
