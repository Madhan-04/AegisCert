import React, { useState, useEffect } from 'react';
import { db, Certificate, User } from '../services/db';
import { Wallet, Download, Share2, ExternalLink, FileText, Award, Briefcase, Grid, CheckCircle2, Copy, Cpu, BookOpen, AlertCircle, Shield } from 'lucide-react';

interface MockVerifiableCredential {
  id: string;
  name: string;
  type: 'degree' | 'marksheet' | 'course' | 'placement';
  issuerName: string;
  issueDate: string;
  blockchainHash: string;
  signature: string;
  status: 'active' | 'suspended' | 'revoked';
  meta: Record<string, any>;
  offlineSignature: string;
  verificationChecksum: string;
}

export default function CredentialWallet() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [degreeCerts, setDegreeCerts] = useState<Certificate[]>([]);
  const [mockCredentials, setMockCredentials] = useState<MockVerifiableCredential[]>([]);
  const [selectedCred, setSelectedCred] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'degree' | 'marksheet' | 'course' | 'placement'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    // 1. Get official degree certificates from local DB
    const allCerts = db.getCertificates();
    const myCerts = allCerts.filter(c => c.rollNo === user.rollNo || c.studentName === user.name);
    setDegreeCerts(myCerts);

    // 2. Generate supplementary credential documents for wallet richness
    const list: MockVerifiableCredential[] = [
      ...myCerts.map(c => ({
        id: c.id,
        name: `${c.degree} in ${c.department}`,
        type: 'degree' as const,
        issuerName: c.institutionName,
        issueDate: c.issueDate,
        blockchainHash: c.blockchainHash,
        signature: c.signature,
        status: c.status as any,
        meta: {
          cgpa: c.cgpa,
          rollNo: c.rollNo,
          regNo: c.regNo,
          graduatingClass: 'First Class with Distinction'
        },
        offlineSignature: c.offlineSignature || 'OFFLINE_SIG_MOCK_DEGREE_0x992388A1',
        verificationChecksum: c.verificationChecksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      })),
      {
        id: 'CRED-MARK-2026-082',
        name: 'Official Academic Transcript - semester VIII',
        type: 'marksheet' as const,
        issuerName: user.institutionName || 'Massachusetts Institute of Technology',
        issueDate: '2026-06-15T09:00:00Z',
        blockchainHash: 'e012a93b49cfa34f19b29e0da092305ca38f6b6c5a6b2e10d3f82cb8a192bc7f',
        signature: 'SIG_MARK_0x99A8F82C1014AFDF4C8996FB9B',
        status: 'active',
        meta: {
          gpa: 3.95,
          totalCredits: 24,
          courses: [
            { code: 'CS-801', title: 'Decentralized Ledgers & Smart Contracts', grade: 'A+' },
            { code: 'CS-802', title: 'Advanced Biometric Security', grade: 'A' },
            { code: 'CS-803', title: 'Quantum Cryptography Systems', grade: 'A-' }
          ]
        },
        offlineSignature: 'OFFLINE_SIG_MARKSHEET_0xEF1289BB',
        verificationChecksum: 'a7c938de1f748ba9cf82e98c76da39df89c56b738ea98ba82cf91a329dbe0921'
      },
      {
        id: 'CRED-CRSE-2025-404',
        name: 'Advanced Cyber Forensic Audit Specialist',
        type: 'course' as const,
        issuerName: 'AegisCert Cyber Security Academy',
        issueDate: '2025-11-20T16:30:00Z',
        blockchainHash: 'a5c9b293817fcf1e2a074092cb838a5b2e109d38c1a7a6b2e10d3f82cb8a192',
        signature: 'SIG_CRSE_0x33b49cfa34f19b29e0da092305ca',
        status: 'active',
        meta: {
          hours: 45,
          score: '96/100',
          instructor: 'Dr. Evelyn Vance'
        },
        offlineSignature: 'OFFLINE_SIG_COURSE_0x66AB819C',
        verificationChecksum: 'f1e2a93bc0928df73a9cb84f9810a9cb84f9810a9cb84f9810a9cb84f9810ac1'
      },
      {
        id: 'CRED-PLAC-2026-003',
        name: 'Placement Offer & Intent Letter - DeepMind security',
        type: 'placement' as const,
        issuerName: 'Google LLC Recruitment Cell',
        issueDate: '2026-05-10T11:00:00Z',
        blockchainHash: 'd1c2b3a4e5f60718293a4b5c6d7e8f90123456789abcde0123456789abcdef0',
        signature: 'SIG_PLAC_0x89abcdef0123456789abcde012345',
        status: 'active',
        meta: {
          role: 'Junior Blockchain Architect',
          location: 'Sunnyvale, CA (Hybrid)',
          ctc: 'Confidential (Grade T5)',
          joiningDate: '2026-07-15T09:00:00Z'
        },
        offlineSignature: 'OFFLINE_SIG_PLACEMENT_0x55EE88AC',
        verificationChecksum: 'd7c838e12f458ba9cf82e98c76da39df89c56b738ea98ba82cf91a329dbe0951'
      }
    ];

    setMockCredentials(list);
  }, []);

  const handleCopyLink = (id: string) => {
    // Generate public shareable url format
    const shareUrl = `${window.location.origin}/#verification?id=${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadJSON = (cred: any) => {
    const jsonStr = JSON.stringify({
      schema: "https://schema.aegiscert.gov/v3/credential.json",
      credentialSubject: {
        id: currentUser?.id,
        name: currentUser?.name,
        email: currentUser?.email,
        rollNo: currentUser?.rollNo,
        regNo: currentUser?.regNo
      },
      credentialDetails: {
        id: cred.id,
        name: cred.name,
        type: cred.type,
        issuerName: cred.issuerName,
        issueDate: cred.issueDate,
        meta: cred.meta
      },
      proof: {
        type: "AegisECDSA2026Proof",
        created: new Date().toISOString(),
        verificationChecksum: cred.verificationChecksum,
        blockchainHash: cred.blockchainHash,
        signatureValue: cred.signature,
        offlineSignature: cred.offlineSignature
      }
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credential-${cred.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCredentials = mockCredentials.filter(c => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Decentralized Credential Wallet
        </h1>
        <p className="text-xs text-slate-400">
          View, share, and export cryptographically signed academic degrees, course credits, and placement records.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3.5 overflow-x-auto">
        {(['all', 'degree', 'marksheet', 'course', 'placement'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all border shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-bold'
                : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'all' ? 'All Credentials' : tab === 'degree' ? 'Degrees' : tab === 'marksheet' ? 'Mark Sheets' : tab === 'course' ? 'Courses' : 'Placement Offers'}
          </button>
        ))}
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List of verifiable items */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCredentials.length === 0 ? (
            <div className="glass-panel border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No verifiable credentials found in this folder.
            </div>
          ) : (
            filteredCredentials.map(cred => (
              <div
                key={cred.id}
                onClick={() => setSelectedCred(cred)}
                className={`premium-card p-5 cursor-pointer flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${
                  selectedCred?.id === cred.id
                    ? 'border-indigo-500/45 bg-indigo-950/10 shadow-[0_0_24px_rgba(108,99,255,0.15)]'
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex gap-3.5 items-center">
                  <div className={`p-3 rounded-xl ${
                    cred.type === 'degree' ? 'bg-indigo-500/10 text-indigo-400' :
                    cred.type === 'marksheet' ? 'bg-emerald-500/10 text-emerald-400' :
                    cred.type === 'course' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {cred.type === 'degree' && <Award className="w-5 h-5" />}
                    {cred.type === 'marksheet' && <FileText className="w-5 h-5" />}
                    {cred.type === 'course' && <BookOpen className="w-5 h-5" />}
                    {cred.type === 'placement' && <Briefcase className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{cred.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cred.issuerName}</p>
                    <div className="flex gap-2 items-center mt-2.5">
                      <span className="inline-flex items-center gap-1 text-[8.5px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        <CheckCircle2 className="w-2.5 h-2.5" /> SECURED
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">Issued {new Date(cred.issueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0 border-t border-white/5 md:border-transparent pt-3.5 md:pt-0 justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(cred.id); }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white transition-all text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedId === cred.id ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadJSON(cred); }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: Selected item detail inspector */}
        <div className="premium-card p-6 space-y-6 border border-white/5 bg-slate-950/40">
          {selectedCred ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/5 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Verifiable Proof</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Apple Wallet-Style Credential Card visual */}
                <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-2xl p-5 flex flex-col justify-between text-white border border-white/10 group transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
                  {/* Background Gradient based on type */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-90 transition-all duration-300 ${
                    selectedCred.type === 'degree' ? 'from-indigo-600 via-indigo-800 to-violet-950' :
                    selectedCred.type === 'marksheet' ? 'from-emerald-600 via-teal-800 to-cyan-950' :
                    selectedCred.type === 'course' ? 'from-amber-500 via-amber-600 to-orange-850' :
                    'from-cyan-600 via-blue-800 to-indigo-950'
                  }`} />
                  
                  {/* Card Glass Overlay Grid */}
                  <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
                  
                  {/* Card Top: Logo and Chip */}
                  <div className="relative z-10 flex justify-between items-start">
                    {/* Holographic Chip */}
                    <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-400/40 via-yellow-200/20 to-amber-400/40 border border-amber-400/30 flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-0.5 w-6 h-4 opacity-50">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="border-t border-l border-amber-400/40" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Brand signature */}
                    <div className="text-[10px] font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 flex items-center gap-1.5">
                      <img src="/logo.jpg" className="w-3.5 h-3.5 rounded-full object-cover border border-white/10" />
                      AEGIS<span className="font-light">CERT</span>
                    </div>
                  </div>

                  {/* Card Middle: Title */}
                  <div className="relative z-10 space-y-1">
                    <span className="text-[8px] uppercase tracking-widest text-white/50 block font-mono">VERIFIABLE CREDENTIAL PASS</span>
                    <h4 className="text-sm font-extrabold text-white truncate max-w-[280px]">{selectedCred.name}</h4>
                  </div>

                  {/* Card Bottom: Holder Name and Seal */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <span className="text-[7px] uppercase tracking-wider text-white/40 block font-mono">Issued To</span>
                      <span className="text-xs font-bold text-slate-100">{currentUser?.name}</span>
                    </div>
                    
                    {/* Golden circular check status seal */}
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-base font-extrabold text-white leading-tight">{selectedCred.name}</h3>
                <p className="text-2xs text-slate-400 leading-relaxed font-mono">{selectedCred.issuerName}</p>
              </div>

              {/* Attributes Panel */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-widest">Metadata Claims</h4>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-2xs space-y-2 font-mono">
                  {Object.entries(selectedCred.meta).map(([key, val]: any) => (
                    <div key={key} className="flex flex-col gap-0.5 border-b border-white/2 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      {Array.isArray(val) ? (
                        <div className="pl-2 mt-1 space-y-1.5">
                          {val.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-[9px] text-slate-400">
                              <span>{item.code || item.title}</span>
                              <span className="text-indigo-400 font-bold">{item.grade || item.score}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-bold truncate">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Signatures */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-widest">Cryptographic Attestation</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono">SHA-256 Checksum</span>
                    <div className="p-2 bg-slate-950/60 rounded-lg text-[9px] font-mono text-slate-400 border border-white/2 break-all">
                      {selectedCred.verificationChecksum}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono">Blockchain Transaction Hash</span>
                    <div className="p-2 bg-slate-950/60 rounded-lg text-[9px] font-mono text-slate-400 border border-white/2 break-all flex justify-between items-center gap-1">
                      <span className="truncate">{selectedCred.blockchainHash}</span>
                      <a href={`https://polygonscan.com/tx/0x${selectedCred.blockchainHash}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono">Offline Signature Seal</span>
                    <div className="p-2 bg-slate-950/60 rounded-lg text-[9px] font-mono text-indigo-400/90 border border-indigo-500/10 break-all font-bold">
                      {selectedCred.offlineSignature}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download CTA */}
              <button
                onClick={() => handleDownloadJSON(selectedCred)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                Download Cryptographic Credential JSON
              </button>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400">Credential Inspector</h4>
                <p className="text-2xs text-slate-500 max-w-[200px] mx-auto mt-1 leading-relaxed">
                  Select any credential from your wallet to audit metadata claims, inspect hashes, or check signatures.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
