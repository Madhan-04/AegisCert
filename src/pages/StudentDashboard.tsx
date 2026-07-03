import React, { useState, useEffect, useRef } from 'react';
import { db, Certificate, User } from '../services/db';
import { GraduationCap, FileText, QrCode, Download, ShieldCheck, Camera, Check, ShieldX, HelpCircle, Activity, UserCheck } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface StudentDashboardProps {
  navigate: (route: string) => void;
}

export default function StudentDashboard({ navigate }: StudentDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Biometric registration state
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);
  const [bioStatus, setBioStatus] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Certificate PDF Preview Drawer
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const loadData = () => {
    const user = db.getCurrentUser();
    if (!user) return;
    
    setCurrentUser(user);

    // Get certificates for this student
    const allCerts = db.getCertificates();
    const myCerts = allCerts.filter(c => c.rollNo === user.rollNo);
    setCertificates(myCerts);

    // Get activity logs for this student
    const allLogs = db.getAuditLogs();
    const myLogs = allLogs.filter(l => l.userId === user.id).slice(0, 5);
    setActivityLogs(myLogs);
  };

  useEffect(() => {
    loadData();
  }, []);

  // QR Code generation helper for Certificate View
  const handleViewCert = async (cert: Certificate) => {
    setSelectedCert(cert);
    try {
      // The QR code encodes the mock verification url
      const verificationUrl = `${window.location.origin}/#verification?id=${cert.id}`;
      const url = await QRCode.toDataURL(verificationUrl, {
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        },
        margin: 2,
        width: 140
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Failed to generate QR Code', err);
    }
  };

  // Fingerprint capture setup (Mantra MFS100 simulation)
  const startFingerprintCapture = () => {
    setBioStatus('Initializing Mantra MFS100 USB sensor capture...');
    triggerRegistrationScan();
  };

  const triggerRegistrationScan = () => {
    setBioScanning(true);
    let step = 0;
    const stages = [
      'Placing finger on Mantra MFS100 USB sensor...',
      'Capturing ridges characteristics (500 DPI)...',
      'Extracting minutiae characteristics...',
      'Encrypting fingerprint print vector...',
      'Writing biometric lock to database...'
    ];

    const timer = setInterval(() => {
      if (step < stages.length) {
        setBioStatus(stages[step]);
        step++;
      } else {
        clearInterval(timer);
        completeFingerprintEnrollment();
      }
    }, 700);
  };

  const completeFingerprintEnrollment = () => {
    setBioScanning(false);
    
    if (!currentUser) return;

    // Save bio token to User table
    const users = db.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const key = `FINGER-Mantra-MFS100-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
        return {
          ...u,
          faceEnrollId: key, // Reused database column to avoid schema changes
          enrolledAt: new Date().toISOString()
        };
      }
      return u;
    });

    db.setUsers(updatedUsers);
    
    // Update active session user
    const updatedSelf = updatedUsers.find(u => u.id === currentUser.id)!;
    db.setCurrentUser(updatedSelf);
    setCurrentUser(updatedSelf);

    db.addAuditLog(currentUser.id, currentUser.name, 'student', 'BIOMETRIC_ENROLLED', 'Enrolled fingerprint ridges authentication profile', 'success');
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 }
    });

    setBioModalOpen(false);
    loadData();
  };

  useEffect(() => {
    if (bioModalOpen) {
      startFingerprintCapture();
    }
  }, [bioModalOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Student Credential Vault</h1>
          <p className="text-sm text-slate-400">View and download your blockchain diplomas, manage biometric locks, and inspect audit activity.</p>
        </div>
        <div className="flex gap-3">
          {!currentUser.faceEnrollId ? (
            <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-xs rounded-xl flex items-center gap-2">
              Setup Pending (Admin required)
            </span>
          ) : (
            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-xl flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5" />
              Fingerprint Lock Enrolled
            </span>
          )}
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left certificates list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5.5 h-5.5 text-indigo-400" />
              My Academic Diplomas ({certificates.length})
            </h3>

            {certificates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No academic academic certificates are registered under your roll number. Contact your university administrator.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-2xs text-indigo-300 font-mono tracking-wider">{cert.id}</span>
                          <h4 className="font-bold text-white text-base mt-1">{cert.degree}</h4>
                          <p className="text-xs text-slate-400">{cert.department}</p>
                        </div>
                        {cert.status === 'active' ? (
                          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldX className="w-6 h-6 text-rose-500 shrink-0" />
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p>Issuer: <span className="text-slate-300">{cert.institutionName}</span></p>
                        <p>CGPA Grade: <span className="text-slate-300 font-bold">{cert.cgpa} / 4.00</span></p>
                        <p>Issue Date: {new Date(cert.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex gap-2">
                      <button
                        onClick={() => handleViewCert(cert)}
                        className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        View Document & QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Info panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Biometrics Status */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white">Security Locks Profile</h3>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">Optical Face Scan</h4>
                  <p className="text-2xs text-slate-500 mt-0.5">Liveness-secured login lock</p>
                </div>
                {currentUser.faceEnrollId ? (
                  <span className="text-2xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Enrolled</span>
                ) : (
                  <span className="text-2xs text-amber-500 font-semibold italic">Admin Authorization Required</span>
                )}
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-200">Fingerprint Key</h4>
                  <p className="text-2xs text-slate-500 mt-0.5">Dual signature confirmation</p>
                </div>
                {currentUser.fingerprintEnrollId ? (
                  <span className="text-2xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Enrolled</span>
                ) : (
                  <span className="text-2xs text-amber-500 font-semibold">Setup Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Activity Registry
            </h3>
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs space-y-0.5">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span className="font-bold text-slate-300">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-500 text-2xs leading-relaxed">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Enrollment Modal Overlay */}
      {bioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scaleUp relative overflow-hidden bg-slate-950/45">
            {bioScanning && <div className="scan-line" />}

            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="p-2.5 bg-primary/10 text-primary-light rounded-xl">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Enroll Fingerprint Ridges</h3>
                <p className="text-xs text-slate-400">Lock credentials with fingerprint biometric key</p>
              </div>
            </div>

            <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <Activity className={`w-14 h-14 ${bioScanning ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
              {bioScanning && <div className="scan-line" />}
              <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Mantra MFS100</span>
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-accent-light animate-pulse h-8 flex items-center justify-center">{bioStatus}</div>
              <p className="text-2xs text-slate-400">Instruct student to place finger on Mantra MFS100 USB scanner device.</p>
            </div>

            <button
              onClick={() => setBioModalOpen(false)}
              className="w-full py-2.5 premium-btn-secondary text-xs"
              disabled={bioScanning}
            >
              Cancel Enrollment
            </button>
          </div>
        </div>
      )}

      {/* Diploma PDF Certificate View Drawer Overlay */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 overflow-y-auto">
          <div className="max-w-4xl w-full space-y-4">
            {/* Action buttons */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Ledger Certificate Print Console</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-slate-950 text-slate-300 border border-white/10 hover:text-white rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500"
                >
                  Close Console
                </button>
              </div>
            </div>

            {/* Certificate Frame */}
            <div className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl border-4 border-double border-slate-300 shadow-2xl relative select-none font-serif min-h-[550px] flex flex-col justify-between print:m-0 print:border-none">
              {/* Background watermark overlay */}
              <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-[0.03] pointer-events-none">
                <ShieldCheck className="w-96 h-96 text-slate-900" />
              </div>

              {/* Top seal header */}
              <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 relative z-10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-800">{selectedCert.institutionName}</h2>
                  <p className="text-2xs font-sans text-slate-500 uppercase tracking-widest font-semibold">Accredited Registrar Academic Division</p>
                </div>
                <div className="text-right text-3xs font-sans text-slate-400 uppercase font-bold space-y-0.5">
                  <p>SECURE LEDGER INDEX</p>
                  <p className="font-mono font-bold text-slate-700">{selectedCert.id}</p>
                </div>
              </div>

              {/* Main content body */}
              <div className="text-center py-8 space-y-6 relative z-10">
                <span className="text-sm font-sans tracking-widest text-slate-400 uppercase font-semibold">This Credential Attests That</span>
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 italic">{selectedCert.studentName}</h3>
                
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  has successfully completed the prescribed curriculum and satisfied all university criteria and academic standards, and is hereby awarded the degree of
                </p>

                <h4 className="text-xl md:text-2xl font-extrabold text-indigo-900 uppercase tracking-wider">{selectedCert.degree}</h4>
                <p className="text-xs font-sans text-slate-500 uppercase font-semibold">with Major Focus Study in <span className="text-slate-800">{selectedCert.department}</span></p>

                <p className="text-xs font-sans text-slate-500">
                  Cumulative Grade Point Average: <span className="font-bold text-slate-800 font-mono text-sm">{selectedCert.cgpa} / 4.00</span>
                </p>
              </div>

              {/* Footer signatures and verification tools */}
              <div className="border-t-2 border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center relative z-10 font-sans">
                {/* Signatures */}
                <div className="sm:col-span-4 text-center sm:text-left space-y-1.5">
                  <div className="h-8 flex items-end justify-center sm:justify-start font-mono italic text-xs text-slate-600">
                    Thomas Smith
                  </div>
                  <div className="w-32 border-t border-slate-300 mx-auto sm:mx-0" />
                  <p className="text-3xs text-slate-400 uppercase font-bold">University Registrar Seal</p>
                </div>

                <div className="sm:col-span-5 text-xs text-slate-500 space-y-1">
                  <p className="text-3xs uppercase font-bold text-slate-400">Blockchain Validation Block</p>
                  <p className="font-mono text-3xs text-slate-700 break-all select-all leading-tight bg-slate-100 p-2 rounded border border-slate-200">
                    HASH: {selectedCert.blockchainHash}
                  </p>
                  <p className="text-3xs italic text-slate-400">Validated on Ethereum Network Ledger</p>
                </div>

                {/* QR Code */}
                <div className="sm:col-span-3 flex justify-center sm:justify-end">
                  {qrCodeUrl && (
                    <div className="p-1 border border-slate-200 rounded-lg bg-white">
                      <img src={qrCodeUrl} alt="Verification QR Code" className="w-24 h-24" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
