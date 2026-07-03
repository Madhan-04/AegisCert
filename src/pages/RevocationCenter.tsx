import React, { useState, useEffect } from 'react';
import { db, Certificate, StatusHistoryEntry } from '../services/db';
import { blockchain } from '../services/blockchain';
import { 
  ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, Play, Check, 
  Search, ShieldCheck, FileText, Ban, Power, ShieldAlert as WarningIcon
} from 'lucide-react';

export default function RevocationCenter() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Changing Status Modal State
  const [updatingCert, setUpdatingCert] = useState<Certificate | null>(null);
  const [targetStatus, setTargetStatus] = useState<Certificate['status']>('active');
  const [reason, setReason] = useState('');
  
  // Mining Progress Overlay
  const [isMining, setIsMining] = useState(false);
  const [miningStatus, setMiningStatus] = useState('');

  const loadData = () => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    
    const allCerts = db.getCertificates();
    if (user && user.role === 'institution') {
      // Filter certificates issued by this specific university admin
      setCerts(allCerts.filter(c => c.institutionId === user.institutionId));
    } else {
      // Super admin has complete visibility over all credentials
      setCerts(allCerts);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatusModal = (cert: Certificate) => {
    setUpdatingCert(cert);
    setTargetStatus(cert.status);
    setReason('');
  };

  const handleCommitStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingCert || !currentUser) return;

    setIsMining(true);
    setMiningStatus('Assembling smart contract update transaction...');

    // Determine on-chain transaction action type
    let txType: 'REVOKE' | 'SUSPEND' | 'ACTIVATE' | 'ISSUE' = 'ACTIVATE';
    if (targetStatus === 'revoked') txType = 'REVOKE';
    else if (targetStatus === 'suspended') txType = 'SUSPEND';

    // Mine the update transaction on EVM
    await blockchain.mineTransaction({
      type: txType,
      certId: updatingCert.id,
      certHash: updatingCert.blockchainHash,
      studentName: updatingCert.studentName,
      issuerAddress: currentUser.institutionId || '0xSystemAdmin',
      issuerName: currentUser.institutionName || 'System Registrar Office'
    }, (nonce: number, currentHash: string) => {
      setMiningStatus(`Mining state change in consensus block... Nonce: ${nonce} (Hash: ${currentHash.substring(0, 16)}...)`);
    });

    // Update database record
    const allCerts = db.getCertificates();
    const updated = allCerts.map(c => {
      if (c.id === updatingCert.id) {
        const history = c.statusHistory || [];
        const entry: StatusHistoryEntry = {
          status: targetStatus,
          timestamp: new Date().toISOString(),
          updatedBy: currentUser.name,
          reason: reason || 'Administrative lifecycle update'
        };
        return {
          ...c,
          status: targetStatus,
          revocationReason: targetStatus === 'revoked' || targetStatus === 'suspended' ? reason : undefined,
          statusHistory: [...history, entry]
        };
      }
      return c;
    });
    db.setCertificates(updated);

    // Audit logs
    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      `CREDENTIAL_STATUS_${targetStatus.toUpperCase()}`,
      `Flipped certificate ${updatingCert.id} status to "${targetStatus}". Reason: ${reason || 'None provided'}`,
      'success'
    );

    // If revoked, write to SOC
    if (targetStatus === 'revoked' || targetStatus === 'suspended') {
      db.addSocEvent(
        targetStatus === 'revoked' ? 'high' : 'medium',
        'CREDENTIAL_LIFECYCLE_WARN',
        `Credential ${updatingCert.id} status flipped to ${targetStatus.toUpperCase()} by ${currentUser.name}`,
        '127.0.0.1'
      );
    }

    setIsMining(false);
    setUpdatingCert(null);
    loadData();
  };

  const filteredCerts = certs.filter(c => 
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'suspended':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'revoked':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      case 'expired':
        return 'bg-slate-500/15 border-white/10 text-slate-400';
      case 'pending':
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';
      case 'draft':
      default:
        return 'bg-white/5 border-white/5 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Ban className="w-8 h-8 text-rose-500" />
          Credential Revocation & Lifecycle Hub
        </h1>
        <p className="text-sm text-slate-400">
          Modify active certificate states. Alterations broadcast immediate smart contract update transactions to the EVM registry ledger.
        </p>
      </div>

      {/* Warning Alert Banner */}
      <section className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-rose-950/5 flex items-start gap-3 text-xs text-rose-300">
        <WarningIcon className="w-5 h-5 shrink-0 animate-pulse text-rose-400" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase tracking-wider block">IRREVERSIBLE CYBER CONTEXTS NOTICE</span>
          <p className="leading-relaxed">
            Revoking a certificate is permanently mined into block logs. While a credential can be re-activated, initial revoked hash hashes remain as permanent receipts inside distributed nodes. Revoked keys automatically deny verification audits.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student credentials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input text-xs"
          />
        </div>
      </section>

      {/* Certificates Roster Table */}
      <section className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-3xs text-slate-500 uppercase border-b border-white/5 bg-slate-950/20">
              <tr>
                <th className="py-4 px-4">Certificate ID</th>
                <th className="py-4 px-4">Student Candidate</th>
                <th className="py-4 px-4">Degree Major</th>
                <th className="py-4 px-4">Ledger Status</th>
                <th className="py-4 px-4 text-right">Failsafe Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    No degree credentials registered.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-300">
                      {c.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-200">
                      <div>{c.studentName}</div>
                      <div className="text-3xs text-slate-500 font-mono mt-0.5">{c.rollNo}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div>{c.degree}</div>
                      <div className="text-3xs text-slate-500 font-semibold mt-0.5">{c.department}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full border text-2xs uppercase tracking-wider font-semibold ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(c)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 border border-white/10 hover:border-primary/40 text-slate-300 font-bold text-3xs uppercase tracking-wider rounded-lg transition-all"
                      >
                        Modify Lifecycle State
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Change Status Modal Dialog */}
      {updatingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 animate-scaleUp text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h4 className="font-extrabold text-white text-base">Modify Credential State</h4>
              <button 
                onClick={() => setUpdatingCert(null)} 
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
              <div className="text-slate-500 uppercase tracking-widest font-bold text-3xs">Target Certificate:</div>
              <div className="font-bold text-white text-sm">{updatingCert.studentName}</div>
              <div className="text-3xs text-indigo-400 font-mono font-bold">{updatingCert.id} • {updatingCert.degree}</div>
            </div>

            <form onSubmit={handleCommitStatusChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Select Status Lifecycle Key:</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as Certificate['status'])}
                  className="w-full px-3 py-2.5 glass-input bg-slate-900 focus:outline-none"
                >
                  <option value="active">Active (Approve & Validate)</option>
                  <option value="suspended">Suspended (Temporarily Freeze)</option>
                  <option value="revoked">Revoked (Permanently Void)</option>
                  <option value="expired">Expired (Validity Passed)</option>
                  <option value="pending">Pending Approval (Registry Holds)</option>
                  <option value="draft">Draft State</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Update Reason / Remarks:</label>
                <textarea
                  required
                  placeholder="Provide audit reason for changing certificate lifecycle status..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 glass-input h-20 text-xs focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Confirm and Broadcast Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mining Progress HUD Overlay */}
      {isMining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 animate-scaleUp font-mono">
            <div className="w-12 h-12 rounded-full border-4 border-dashed border-primary/30 border-t-primary animate-spin mx-auto" />
            <div className="text-xs text-primary-light animate-pulse">{miningStatus}</div>
            <p className="text-2xs text-slate-500 font-sans leading-relaxed">
              Consensus validator node is searching the proof-of-work hash nonce. On-chain registry mapping updates will be executed upon completion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
