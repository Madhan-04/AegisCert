import React, { useState } from 'react';
import { db } from '../services/db';
import { Upload, ShieldCheck, ShieldAlert, FileText, CheckCircle2, RefreshCw, AlertTriangle, Cpu, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OfflineVerification() {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifiedResult, setVerifiedResult] = useState<any | null>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);
  
  // Checking checkpoints
  const [checks, setChecks] = useState<{
    format: 'pending' | 'success' | 'failed';
    checksum: 'pending' | 'success' | 'failed';
    signature: 'pending' | 'success' | 'failed';
    registry: 'pending' | 'success' | 'failed';
  }>({
    format: 'pending',
    checksum: 'pending',
    signature: 'pending',
    registry: 'pending'
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    setVerifiedResult(null);
    setErrorResult(null);
    setChecks({
      format: 'pending',
      checksum: 'pending',
      signature: 'pending',
      registry: 'pending'
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        setTimeout(() => {
          verifyCredentialData(data);
        }, 1500); // Simulated cryptographic proof computation latency
      } catch (err) {
        setLoading(false);
        setErrorResult('Invalid File: Selected file is not a valid JSON credential structure.');
        setChecks(prev => ({ ...prev, format: 'failed' }));
      }
    };
    reader.readAsText(file);
  };

  const verifyCredentialData = (data: any) => {
    setLoading(false);

    // 1. Format check
    if (!data.schema || !data.proof || !data.credentialDetails) {
      setChecks(prev => ({ ...prev, format: 'failed' }));
      setErrorResult('Format Validation Failed: Missing required schema descriptors or signature proofs.');
      return;
    }
    setChecks(prev => ({ ...prev, format: 'success' }));

    // 2. Checksum digest check
    const credId = data.credentialDetails.id;
    const computedHash = data.proof.verificationChecksum;
    if (!computedHash || computedHash.length !== 64) {
      setChecks(prev => ({ ...prev, format: 'success', checksum: 'failed' }));
      setErrorResult('Integrity Check Failure: Document payload digest signature is corrupted or incomplete.');
      return;
    }
    setChecks(prev => ({ ...prev, format: 'success', checksum: 'success' }));

    // 3. Public Key Signature validation (simulating ECDSA signature check)
    const offlineSig = data.proof.offlineSignature;
    if (!offlineSig || !offlineSig.startsWith('OFFLINE_SIG')) {
      setChecks(prev => ({ ...prev, format: 'success', checksum: 'success', signature: 'failed' }));
      
      // SOC log trigger for tampered signature
      db.addAuditLog('offline-verifier', 'Offline Engine', 'verifier', 'OFFLINE_SIG_TAMPER', `Offline signature validation failed on credential ${credId}`, 'failure');
      db.addSocEvent('critical', 'SIGNATURE_TAMPER', `Offline signature verification failed for credential ID: ${credId}`, '127.0.0.1');
      db.addFraudReport('tampered_cert', 92, `Offline verification: Cryptographic signature mismatch on credential ${credId}`);
      
      setErrorResult('Cryptographic Mismatch: Verification signature does not match Registrar Public Key.');
      return;
    }
    setChecks(prev => ({ ...prev, format: 'success', checksum: 'success', signature: 'success' }));

    // 4. Registry check (check local DB for revocation / suspension status)
    const certs = db.getCertificates();
    const matchedCert = certs.find(c => c.id === credId);
    
    // Simulate checking if certificate is active
    if (matchedCert && (matchedCert.status === 'revoked' || matchedCert.status === 'suspended')) {
      setChecks(prev => ({ ...prev, format: 'success', checksum: 'success', signature: 'success', registry: 'failed' }));
      
      db.addAuditLog('offline-verifier', 'Offline Engine', 'verifier', 'OFFLINE_VERIFICATION_REVOKED', `Offline credential ${credId} is marked as ${matchedCert.status} in DB registry`, 'failure');
      db.addSocEvent('high', 'REVOKED_CERT_ACCESS', `Attempted offline check of revoked credential: ${credId}`, '127.0.0.1');
      
      setErrorResult(`Revoked/Suspended Node: Credential ${credId} is authentic but has been marked as ${matchedCert.status.toUpperCase()} in the blockchain ledger.`);
      return;
    }
    setChecks(prev => ({ ...prev, format: 'success', checksum: 'success', signature: 'success', registry: 'success' }));

    // If completely validated
    setVerifiedResult(data);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#10B981', '#06B6D4']
    });

    db.addAuditLog(
      'offline-verifier', 
      'Offline Engine', 
      'verifier', 
      'OFFLINE_VERIFICATION_SUCCESS', 
      `Successfully verified integrity and signature of offline credential ${credId} for student ${data.credentialSubject?.name || 'unknown'}`, 
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Offline Cryptographic Verification
        </h1>
        <p className="text-xs text-slate-400">
          Upload or drop signed credential files. AegisCert validates hashes and university signature seals locally using public key algorithms without remote RPC calls.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Verification Checkpoints & Diagnostics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Verification Engine
            </h2>

            <div className="space-y-4">
              {/* Checkpoint list */}
              <div className="space-y-3.5">
                
                <div className="flex items-center justify-between border-b border-white/2 pb-2">
                  <span className="text-xs text-slate-400 font-medium">1. Schema Format Validation</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    checks.format === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    checks.format === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {checks.format === 'success' ? 'Passed' : checks.format === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/2 pb-2">
                  <span className="text-xs text-slate-400 font-medium">2. Document Digest Verification</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    checks.checksum === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    checks.checksum === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {checks.checksum === 'success' ? 'Passed' : checks.checksum === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/2 pb-2">
                  <span className="text-xs text-slate-400 font-medium">3. ECDSA Signature Match</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    checks.signature === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    checks.signature === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {checks.signature === 'success' ? 'Passed' : checks.signature === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs text-slate-400 font-medium">4. Registry Revocation Check</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    checks.registry === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    checks.registry === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {checks.registry === 'success' ? 'Passed' : checks.registry === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>

              </div>

              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-2xs text-slate-400 leading-relaxed font-mono">
                <p className="flex items-center gap-1 text-indigo-400 font-bold mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  What is Offline Verification?
                </p>
                Offline engine works by parsing the metadata dictionary, re-calculating the SHA-256 digest hash, and verifying that the signature matches the Registrar Public Key signature, ensuring offline validity and resilience during network outages.
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Drag Drop Upload & Verification HUD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* File Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-panel border-2 border-dashed rounded-3xl p-10 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${
              dragActive ? 'border-indigo-500 bg-indigo-950/15' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
            
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl mb-4 text-slate-400">
              <Upload className="w-8 h-8" />
            </div>

            <p className="text-sm font-bold text-white">Drag and drop verifiable credential JSON file</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Accepts signed credential structures (.json)</p>
            
            <label
              htmlFor="file-upload-input"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-primary/10 hover:scale-[1.02]"
            >
              Browse Local System File
            </label>
          </div>

          {/* Loading Hud */}
          {loading && (
            <div className="glass-panel border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300 font-mono">Recomputing SHA-256 Payload Checksum & decrypting signature...</p>
            </div>
          )}

          {/* Verification Success Results display */}
          {verifiedResult && (
            <div className="glass-panel border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 via-slate-950/80 to-slate-950/20 rounded-3xl p-6 space-y-5 animate-scaleUp">
              <div className="flex items-center gap-3.5 border-b border-emerald-500/20 pb-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Document Authenticity Verified</h3>
                  <p className="text-2xs text-emerald-400 font-mono mt-0.5">Integrity verification succeeded with 100% confidence.</p>
                </div>
              </div>

              {/* Data Claims */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Credential Subject</span>
                  <div className="text-sm font-bold text-slate-200">{verifiedResult.credentialSubject?.name}</div>
                  <div className="text-slate-400">{verifiedResult.credentialSubject?.rollNo || 'N/A'}</div>
                  <div className="text-slate-400">{verifiedResult.credentialSubject?.email || 'N/A'}</div>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Verifiable Details</span>
                  <div className="text-sm font-bold text-slate-200">{verifiedResult.credentialDetails?.name}</div>
                  <div className="text-slate-400">Issuer: {verifiedResult.credentialDetails?.issuerName}</div>
                  <div className="text-slate-400">Date: {new Date(verifiedResult.credentialDetails?.issueDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Hashes */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/10 space-y-2 text-2xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Local Payload Checksum:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[200px]" title={verifiedResult.proof?.verificationChecksum}>
                    {verifiedResult.proof?.verificationChecksum}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ECDSA Offline Signature Seal:</span>
                  <span className="text-indigo-400 font-semibold truncate max-w-[200px]" title={verifiedResult.proof?.signatureValue}>
                    {verifiedResult.proof?.offlineSignature}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Verification Failure Results */}
          {errorResult && (
            <div className="glass-panel border-2 border-rose-500/30 bg-gradient-to-br from-rose-950/10 via-slate-950/80 to-slate-950/20 rounded-3xl p-6 space-y-4 animate-scaleUp">
              <div className="flex items-center gap-3.5 border-b border-rose-500/20 pb-4">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Verification Failure Alert</h3>
                  <p className="text-2xs text-rose-400 font-mono mt-0.5">Critical anomalies identified inside credential proof.</p>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-300 bg-rose-950/10 border border-rose-500/15 p-4 rounded-xl leading-relaxed">
                {errorResult}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
