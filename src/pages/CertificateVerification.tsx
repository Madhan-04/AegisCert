import React, { useState, useEffect, useRef } from 'react';
import { db, Certificate } from '../services/db';
import { blockchain, Block, Transaction } from '../services/blockchain';
import { 
  Search, ShieldCheck, AlertTriangle, ShieldAlert, Cpu, Calendar, Clock, 
  Scan, Camera, User, Check, Landmark, Award, ArrowRight, Activity, ChevronRight, FileUp
} from 'lucide-react';

export default function CertificateVerification() {
  const [query, setQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [result, setResult] = useState<{
    searched: boolean;
    found: boolean;
    cert?: Certificate;
    block?: Block;
    tx?: Transaction;
    isTampered: boolean;
    isRevoked: boolean;
  } | null>(null);

  // Biometric holder validation
  const [holderCheckOpen, setHolderCheckOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState('');
  const [matchingProgress, setMatchingProgress] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState<boolean | null>(null);
  const [livenessStep, setLivenessStep] = useState(0);

  const livenessSteps = [
    { label: 'Blink Check', prompt: 'Blink your eyes to verify liveness' },
    { label: 'Rotate Left', prompt: 'Turn your face slowly to the left' },
    { label: 'Rotate Right', prompt: 'Turn your face slowly to the right' },
    { label: 'Smile Check', prompt: 'Smile to verify conscious presence' },
    { label: 'Compile Seal', prompt: 'Validating identity ownership token' }
  ];
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-search if ID is passed in hash query param, e.g. #verification?id=CERT-2025-4819
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('?id=')) {
        const id = hash.split('?id=')[1];
        if (id) {
          setQuery(id);
          triggerVerification(id);
        }
      }
    };
    
    handleHashChange(); // Run on mount
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const triggerVerification = async (searchId: string) => {
    setIsVerifying(true);
    setResult(null);
    setVerifyStatus('Connecting to Ethereum RPC node...');

    const settings = db.getSettings();
    const latency = settings.networkLatency;

    // 1. Check Emergency System Freeze
    if (settings.killSwitchActive) {
      setIsVerifying(false);
      setVerifyStatus('Verification Blocked: Emergency system freeze is in effect.');
      return;
    }

    // 2. Check Honeypot Decoy Certificate
    if (searchId.trim().toLowerCase() === 'cert-decoy-777') {
      setIsVerifying(false);
      setVerifyStatus('Verification Blocked: Decoy Honeypot Node Triggered.');
      
      // Log alarms
      db.addAuditLog('anonymous', 'Anonymous Verifier', 'verifier', 'DECOY_QUERY_ATTEMPT', 'Decoy honeypot certificate CERT-DECOY-777 was queried', 'failure', 99);
      db.addSocEvent('critical', 'DECOY_ACCESS_ATTEMPT', 'Honeypot Warning: Intruder accessed decoy record CERT-DECOY-777', '127.0.0.1');
      db.addFraudReport('tampered_cert', 99, 'Decoy Trap: Access attempt on decoy certificate ID CERT-DECOY-777.');
      return;
    }

    setTimeout(() => {
      setVerifyStatus('Fetching smart contract transaction receipts...');
      setTimeout(async () => {
        setVerifyStatus('Computing cryptographic metadata SHA-256 hash...');
        
        setTimeout(async () => {
          // Perform blockchain check
          const certs = db.getCertificates();
          const foundCert = certs.find(
            c => c.id.toLowerCase() === searchId.toLowerCase() || 
            c.rollNo.toLowerCase() === searchId.toLowerCase() ||
            c.regNo.toLowerCase() === searchId.toLowerCase()
          );

          if (!foundCert) {
            setResult({ searched: true, found: false, isTampered: false, isRevoked: false });
            setIsVerifying(false);
            db.addAuditLog('anonymous', 'Anonymous Verifier', 'verifier', 'CREDENTIAL_NOT_FOUND', `Queried credential "${searchId}" - Not found in index`, 'failure');
            return;
          }

          // Check if tampered in simulator settings
          const isTampered = settings.tamperedCerts.includes(foundCert.id);
          // Let's modify the hash for local comparison if tampered
          const localHash = isTampered ? `0000_TAMPERED_${foundCert.blockchainHash.slice(14)}` : foundCert.blockchainHash;

          const audit = await blockchain.verifyOnChain(foundCert.id, localHash);

          setResult({
            searched: true,
            found: true,
            cert: foundCert,
            block: audit.block,
            tx: audit.tx,
            isTampered: audit.isTampered || isTampered,
            isRevoked: audit.status === 'revoked'
          });

          setIsVerifying(false);

          // Add audit logs depending on verification results
          const verifier = db.getCurrentUser();
          const verifierId = verifier?.id || 'anonymous';
          const verifierName = verifier?.name || 'Anonymous Verifier';

          if (isTampered) {
            db.addAuditLog(verifierId, verifierName, verifier?.role || 'verifier', 'CREDENTIAL_TAMPERED', `AI FRAUD ALERT: Detected hash alteration on certificate ${foundCert.id}`, 'failure');
          } else if (audit.status === 'revoked') {
            db.addAuditLog(verifierId, verifierName, verifier?.role || 'verifier', 'CREDENTIAL_QUERY_REVOKED', `Queried revoked certificate ${foundCert.id}`, 'failure');
          } else {
            db.addAuditLog(verifierId, verifierName, verifier?.role || 'verifier', 'CREDENTIAL_VERIFIED', `Successfully audited certificate ${foundCert.id} on blockchain`, 'success');
          }

        }, latency / 3);
      }, latency / 3);
    }, latency / 3);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Set query parameter in hash manually
    window.location.hash = `verification?id=${query.trim()}`;
  };

  // Mock file upload processing (extracts mock certificate ID from file name)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate reading file and finding key
    setIsVerifying(true);
    setVerifyStatus('Parsing uploaded digital credential PDF...');
    
    setTimeout(() => {
      // Look for typical test names in filename, otherwise use default
      let testId = 'CERT-2025-4819';
      if (file.name.toLowerCase().includes('stan')) {
        testId = 'CERT-2025-2810';
      } else if (file.name.toLowerCase().includes('chang') || file.name.toLowerCase().includes('michael')) {
        testId = 'CERT-2024-9041';
      }
      
      triggerVerification(testId);
    }, 1000);
  };

  // Start fingerprint capture for matching
  const startFingerprintCapture = () => {
    setMatchingProgress(true);
    setMatchSuccess(null);
    setMatchingStatus('Mantra MFS100 initializing sensor calibration...');
    
    // Simulate fingerprint capture process
    let step = 0;
    const intervals = [
      'Placing finger on Mantra MFS100 USB sensor...',
      'Capturing finger ridge characteristics (scanning 500 DPI)...',
      'Minutiae points extraction and validation...',
      'Matching against blockchain-anchored biometric credentials...'
    ];

    const timer = setInterval(() => {
      if (step < intervals.length) {
        setMatchingStatus(intervals[step]);
        step++;
      } else {
        clearInterval(timer);
        setMatchingProgress(false);
        
        // Match results based on certificate student
        if (result?.cert?.studentName === 'Alex Johnson') {
          // Alex has registered finger template, match succeeds!
          setMatchSuccess(true);
          setMatchingStatus('FINGERPRINT MATCHED: 100% CORRELATION');
          
          const verifier = db.getCurrentUser();
          db.addAuditLog(
            verifier?.id || 'anonymous',
            verifier?.name || 'Anonymous Verifier',
            verifier?.role || 'verifier',
            'BIOMETRIC_MATCH_SUCCESS',
            `Successfully matched fingerprint biometric records for Alex Johnson's certificate ${result.cert.id}`,
            'success'
          );
        } else {
          // Others fail match
          setMatchSuccess(false);
          setMatchingStatus('BIOMETRIC VALIDATION FAILED: Fingerprint mismatch');
          
          const verifier = db.getCurrentUser();
          db.addAuditLog(
            verifier?.id || 'anonymous',
            verifier?.name || 'Anonymous Verifier',
            verifier?.role || 'verifier',
            'BIOMETRIC_MATCH_FAILED',
            `Failed biometric match: Candidate fingerprint does not hold registered template for ${result?.cert?.studentName}`,
            'failure'
          );
          
          // Log alert to SOC and AI Fraud report
          db.addSocEvent('high', 'BIOMETRIC_SPOOF_DETECTION', `Fingerprint biometric validation mismatch triggered for certificate holder of "${result?.cert?.studentName || 'Unknown'}"`, '127.0.0.1');
          db.addFraudReport('biometric_spoof', 82, `Identity mismatch: fingerprint verification exception for degree key ${result?.cert?.id}`);
        }
      }
    }, 1200);
  };

  useEffect(() => {
    if (holderCheckOpen) {
      startFingerprintCapture();
    } else {
      setMatchSuccess(null);
    }
  }, [holderCheckOpen]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Cryptographic Verification Portal</h1>
        <p className="text-sm text-slate-400">Perform deep audits on certificates using Ethereum blockchain logs and biometric matching.</p>
      </div>

      {/* Lookup controls */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Search Input */}
        <div className="md:col-span-8 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Search Registry Index</h3>
            <p className="text-2xs text-slate-400">Search by Certificate ID, Roll Number, or Registration ID.</p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={db.getSettings().killSwitchActive ? 'Verification Locked' : 'e.g. CERT-2025-4819'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 glass-input text-sm"
              required
              disabled={db.getSettings().killSwitchActive}
            />
            <button
              type="submit"
              disabled={db.getSettings().killSwitchActive}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm rounded-xl disabled:opacity-50"
            >
              {db.getSettings().killSwitchActive ? 'Locked' : 'Verify'}
            </button>
          </form>
        </div>

        {/* File Drag and Drop */}
        <div className="md:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 relative">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Verify Document File</h3>
            <p className="text-2xs text-slate-400">Upload credential PDF file to check integrity.</p>
          </div>
          
          <label className="border border-dashed border-white/10 hover:border-primary/40 bg-slate-950/20 hover:bg-slate-950/40 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-semibold text-slate-400 hover:text-white">
            <FileUp className="w-4 h-4 text-indigo-400" />
            Upload Diploma Copy
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* Dynamic Handshake Animation */}
      {isVerifying && (
        <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center space-y-4 font-mono">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-primary/30 border-t-primary animate-spin mx-auto" />
          <div className="text-xs text-primary-light animate-pulse">{verifyStatus}</div>
          <p className="text-2xs text-slate-500 font-sans">Connecting to RPC gateways, matching document checksum hash tags against distributed smart contract events...</p>
        </div>
      )}

      {/* Verification Audit Result Reports */}
      {result && result.searched && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. NOT FOUND REPORT */}
          {!result.found && (
            <div className="glass-panel p-8 rounded-3xl border border-rose-500/10 bg-rose-950/5 flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Record Authentication Failed</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  No registered record matches this query. The Certificate ID is unregistered on the blockchain ledger network. Verify credentials and spelling.
                </p>
              </div>
            </div>
          )}

          {/* 2. TAMPERED FAILURE REPORT (AI Fraud Detection) */}
          {result.found && result.isTampered && result.cert && (
            <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 bg-rose-950/10 space-y-6">
              <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                <ShieldAlert className="w-10 h-10 text-rose-500 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-rose-400">AI Fraud Alert: Tampering Detected</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold font-mono">CRITICAL AUDIT EXCEPTION • POST-SIGNATURE CHECKSUM MISMATCH</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono leading-relaxed">
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <span className="block text-2xs uppercase text-slate-500 font-bold">COMPUTED DOCUMENT HASH (Tampered copy)</span>
                  <span className="text-rose-400 break-all select-all font-bold">
                    0000_TAMPERED_{result.cert.blockchainHash.slice(14)}
                  </span>
                  <p className="text-2xs text-rose-500/80 font-sans mt-2">
                    The SHA-256 checksum calculated from this certificate file does not match its blockchain transaction logs.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <span className="block text-2xs uppercase text-slate-500 font-bold">LEDGER SMART CONTRACT HASH (Authentic record)</span>
                  <span className="text-emerald-400 break-all select-all font-bold">
                    {result.cert.blockchainHash}
                  </span>
                  <p className="text-2xs text-emerald-500/80 font-sans mt-2">
                    The immutable hash stored inside the Ethereum blockchain block transaction receipt.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed space-y-2">
                <p className="font-bold text-white">AI Fraud Intelligence Diagnostics:</p>
                <p>
                  Our validation filters detected an active integrity mismatch. The academic certificate has been altered post-signature. Either the GPA, Student Name, Major, or Graduation Date was modified in the local database. The digital seal of university authority is broken.
                </p>
                <p className="text-rose-500/90 font-semibold font-mono">
                  ALERT ROUTED: A fraud anomaly alert was logged, pinning IP 127.0.0.1.
                </p>
              </div>
            </div>
          )}

          {/* 3. REVOKED REPORT */}
          {result.found && !result.isTampered && result.isRevoked && result.cert && (
            <div className="glass-panel p-8 rounded-3xl border border-amber-500/20 bg-amber-950/10 space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-amber-500">Degree Contract Revoked</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">STATUS: INVALIDATED LEDGER KEY</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 text-xs space-y-2 leading-relaxed text-slate-300">
                <p>Revocation Details:</p>
                <p>Academic Certificate ID: <span className="font-mono text-amber-300">{result.cert.id}</span></p>
                <p>Official Reason: <span className="text-white font-bold">{result.cert.revocationReason || 'Administrative correction'}</span></p>
                <p className="text-2xs text-slate-500">Note: The credential's initial mining logs are preserved in block consensus, but its smart contract state has been flipped to Revoked by the issuing authority, rendering it void for employment verification.</p>
              </div>
            </div>
          )}

          {/* 4. SUCCESS VERIFIED REPORT */}
          {result.found && !result.isTampered && !result.isRevoked && result.cert && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Details Card */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden space-y-6">
                  {/* Glowing seal background */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />

                  {/* Header stamp */}
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-3xs uppercase text-slate-500 font-bold tracking-widest">AegisCert Certified</span>
                        <h3 className="text-lg font-bold text-white">Credential Authenticated</h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-2xs font-semibold rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </div>

                  {/* Student Credentials details */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">Student Name</span>
                      <span className="text-white font-bold text-sm">{result.cert.studentName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">University Issuer</span>
                      <span className="text-white font-bold text-sm flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                        {result.cert.institutionName}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">Roll / Registration ID</span>
                      <span className="text-slate-300 font-mono">{result.cert.rollNo} / {result.cert.regNo}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">Degree / major</span>
                      <span className="text-slate-300 font-bold">{result.cert.degree}</span>
                      <p className="text-2xs text-slate-500 font-semibold">{result.cert.department}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">CGPA Score</span>
                      <span className="text-emerald-400 font-bold text-sm font-mono">{result.cert.cgpa} / 4.00</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-3xs">Mined Date</span>
                      <span className="text-slate-300">{new Date(result.cert.issueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Cryptographic blocks */}
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3 font-mono text-2xs text-slate-400">
                    <span className="block text-3xs text-slate-500 font-bold uppercase tracking-wider font-sans">Blockchain transaction logs</span>
                    
                    <div className="flex justify-between">
                      <span>Ledger Anchor Hash:</span>
                      <span className="text-indigo-300 break-all select-all font-bold ml-4 text-right">
                        {result.cert.blockchainHash}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-white/5 pt-2">
                      <span>Digital signature:</span>
                      <span className="text-slate-500 break-all select-all text-right">
                        {result.cert.signature}
                      </span>
                    </div>

                    {result.block && (
                      <div className="flex justify-between border-t border-white/5 pt-2 text-3xs text-slate-500 font-sans">
                        <span>Block Index: #{result.block.number}</span>
                        <span>Nonce: {result.block.nonce}</span>
                        <span>Validator status: Synced</span>
                      </div>
                    )}
                  </div>

                  {/* Biometric verification trigger */}
                  <div className="pt-2">
                    <button
                      onClick={() => setHolderCheckOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 border border-accent/20 hover:border-accent/40 text-xs font-semibold rounded-xl text-accent-light flex items-center justify-center gap-2 transition-all"
                    >
                      <Scan className="w-4.5 h-4.5" />
                      Verify Physical Holder Identity (Biometrics Match)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Timeline Card */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="font-bold text-white text-base">Certificate Lifecycle Timeline</h3>
                  
                  <div className="relative border-l border-white/10 pl-6 ml-2 space-y-6 text-xs">
                    {/* Step 1 */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0 bg-emerald-500 border border-emerald-400 text-white rounded-full p-1 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      <h4 className="font-bold text-white">Student Registered</h4>
                      <p className="text-slate-500 text-2xs">{new Date(result.cert.issueDate).toLocaleDateString()} - Registrar Database</p>
                      <p className="text-slate-400 text-2xs mt-1">Student details mapped and checked against enrollment criteria.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0 bg-emerald-500 border border-emerald-400 text-white rounded-full p-1 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      <h4 className="font-bold text-white">Digital Signature Mapped</h4>
                      <p className="text-slate-500 text-2xs">Generated using registrar private key</p>
                      <p className="text-slate-400 text-2xs mt-1">Metadata hashed to SHA-256 and signed, establishing authority authenticity.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0 bg-emerald-500 border border-emerald-400 text-white rounded-full p-1 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      <h4 className="font-bold text-white">Anchored to Ethereum block</h4>
                      {result.block && <p className="text-slate-500 text-2xs">Mined in Block #{result.block.number}</p>}
                      <p className="text-slate-400 text-2xs mt-1">Transaction written permanently to EVM consensus logs. Non-repudiation established.</p>
                    </div>

                    {/* Step 4 */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0 bg-indigo-500 border border-indigo-400 text-white rounded-full p-1 flex items-center justify-center animate-ping" />
                      <span className="absolute -left-[31px] top-0 bg-indigo-500 border border-indigo-400 text-white rounded-full p-1 flex items-center justify-center">
                        <Activity className="w-3 h-3" />
                      </span>
                      <h4 className="font-bold text-indigo-400">Verifiably Audited</h4>
                      <p className="text-slate-500 text-2xs">Verified just now</p>
                      <p className="text-slate-400 text-2xs mt-1">Verified query confirmed ledger state matches document copy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Biometric Holder Matcher Modal Overlay */}
      {holderCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-6">
          <div className="premium-card p-6 max-w-md w-full space-y-6 relative overflow-hidden bg-slate-950/45 border border-white/10">
            {matchingProgress && <div className="scan-line" />}

            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scan className="w-4.5 h-4.5 text-indigo-400" />
                MFS100 Biometric Verification
              </h3>
              <button 
                onClick={() => setHolderCheckOpen(false)} 
                className="text-slate-400 hover:text-white"
                disabled={matchingProgress}
              >
                Close
              </button>
            </div>

            {/* Simulated Fingerprint scanning lens */}
            <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center transition-all">
              <Activity className={`w-14 h-14 ${matchingProgress ? 'text-indigo-400 animate-pulse' : matchSuccess === true ? 'text-emerald-400' : matchSuccess === false ? 'text-rose-500' : 'text-slate-600'}`} />
              {matchingProgress && <div className="scan-line" />}
              <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">MANTRA SENSOR</span>
            </div>

            <div className="text-center space-y-4">
              <div className={`text-2xs font-mono font-bold leading-normal min-h-[32px] flex items-center justify-center ${matchSuccess === true ? 'text-emerald-400' : matchSuccess === false ? 'text-rose-500' : 'text-slate-300 animate-pulse'}`}>
                {matchingStatus}
              </div>

              {!matchingProgress && matchSuccess === null && (
                <button
                  onClick={startFingerprintCapture}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <Scan className="w-4 h-4" />
                  Capture Fingerprint ridges
                </button>
              )}

              {matchSuccess === true && result?.cert && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-2xs text-emerald-400 leading-relaxed font-sans animate-fadeIn text-left">
                  <p className="font-bold">Identity Match Confirmed (100% Correlation):</p>
                  <p className="mt-1">
                    The fingerprint scan matches the registered biometric templates stored for {result.cert.studentName}. Holder is the authentic owner.
                  </p>
                </div>
              )}

              {matchSuccess === false && result?.cert && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-2xs text-rose-400 leading-relaxed font-sans animate-fadeIn text-left">
                  <p className="font-bold">Biometric Match Exception:</p>
                  <p className="mt-1">
                    The candidate fingerprint does not match the registered database records for {result.cert.studentName}. An anomaly exception was flagged.
                  </p>
                </div>
              )}

              {!matchingProgress && matchSuccess !== null && (
                <button
                  onClick={() => setHolderCheckOpen(false)}
                  className="w-full py-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Exit Biometrics Console
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
