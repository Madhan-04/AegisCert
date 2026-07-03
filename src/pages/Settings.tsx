import React, { useState, useEffect } from 'react';
import { db, User } from '../services/db';
import { Settings as SettingsIcon, Sliders, ShieldCheck, AlertTriangle, Key, Cpu, RefreshCw, Send, Check } from 'lucide-react';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // General settings
  const [latency, setLatency] = useState(400);
  const [rpcUrl, setRpcUrl] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [tampered, setTampered] = useState(false);

  // Update password states
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pwdError, setPwdError] = useState('');
  
  // Storage inspector state
  const [encryptedDBInspect, setEncryptedDBInspect] = useState('');

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    const settings = db.getSettings();
    setLatency(settings.networkLatency);
    setRpcUrl(settings.blockchainExplorerUrl);
    setContractAddress(settings.smartContractAddress);
    setTampered(settings.tamperedCerts.includes('CERT-2025-4819'));

    // Read the encrypted user db string from localStorage for visual proof
    const rawDB = localStorage.getItem('csv_enc_users') || '';
    setEncryptedDBInspect(rawDB);
  }, []);

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = db.getSettings();
    settings.networkLatency = latency;
    settings.blockchainExplorerUrl = rpcUrl;
    settings.smartContractAddress = contractAddress;
    
    if (tampered) {
      if (!settings.tamperedCerts.includes('CERT-2025-4819')) {
        settings.tamperedCerts.push('CERT-2025-4819');
      }
    } else {
      settings.tamperedCerts = [];
    }

    db.setSettings(settings);
    
    const user = db.getCurrentUser();
    db.addAuditLog(user?.id || 'admin', user?.name || 'User', user?.role || 'admin', 'SYSTEM_SETTINGS_UPDATE', 'Updated system network and security settings parameters', 'success');

    alert('General settings saved successfully.');
  };

  const handleSendUpdatePasswordOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setOtpError('');

    if (!currentUser) return;

    // Verify current password
    const users = db.getUsers();
    const self = users.find(u => u.id === currentUser.id);
    if (!self || self.password !== currentPwd) {
      setPwdError('Current password entered is incorrect.');
      return;
    }

    if (newPwd.length < 6) {
      setPwdError('New password key must be at least 6 characters.');
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match.');
      return;
    }

    // Trigger OTP SMS/Email Dispatch
    const target = currentUser.email || currentUser.contact || '';
    db.sendOTP(target);
    setOtpSent(true);
  };

  const handleVerifyPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!currentUser) return;

    const target = currentUser.email || currentUser.contact || '';
    const verifySuccess = db.verifyOTP(target, otpInput);

    if (verifySuccess) {
      // Save password change in encrypted DB
      const users = db.getUsers();
      const updated = users.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, password: newPwd };
        }
        return u;
      });

      db.setUsers(updated);
      db.addAuditLog(currentUser.id, currentUser.name, currentUser.role, 'USER_PASSWORD_CHANGED', 'Updated account password key using SMS OTP verification', 'success');

      alert('Password updated successfully.');
      
      // Reset forms
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setOtpInput('');
      setOtpSent(false);

      // Refresh inspector view
      const rawDB = localStorage.getItem('csv_enc_users') || '';
      setEncryptedDBInspect(rawDB);
    } else {
      setOtpError('Invalid OTP code. Check the SMS OTP dispatcher alert in the top-right.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left panel: configurations */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
          <p className="text-sm text-slate-400">Configure RPC nodes, smart contracts, update password keys, and review database files.</p>
        </div>

        {/* General Node Settings */}
        {currentUser?.role === 'admin' && (
          <form onSubmit={handleGeneralSave} className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-primary-light" />
                Network RPC & Simulation Settings
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-2xs font-semibold text-slate-400">
                  <span>Simulated Blockchain Node Latency</span>
                  <span className="text-indigo-400">{latency} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={latency}
                  onChange={(e) => setLatency(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="space-y-3 text-2xs">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase font-semibold">Smart Contract Registry Address</label>
                  <input
                    type="text"
                    required
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input font-mono"
                  />
                </div>
              </div>

              {/* Anomaly fraud checkbox */}
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-1">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="tamper-opt"
                    checked={tampered}
                    onChange={(e) => setTampered(e.target.checked)}
                    className="rounded border-white/10 text-rose-600 focus:ring-rose-500 w-4 h-4 bg-slate-900 cursor-pointer"
                  />
                  <label htmlFor="tamper-opt" className="text-2xs text-rose-400 font-bold cursor-pointer uppercase tracking-wider">
                    Simulate AI Fraud Tampering
                  </label>
                </div>
                <p className="text-3xs text-slate-500 leading-relaxed font-semibold">
                  Intentionally compromises Alex Johnson's certificate hash in database tables to verify AI warning triggers.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl transition-all"
              >
                Save Settings Configuration
              </button>
            </div>
          </form>
        )}

        {/* Encrypted Database Inspector */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            Decentralized Encrypted Storage File Inspector
          </h3>
          <p className="text-2xs text-slate-400 leading-relaxed">
            All user attributes, biometric keys, and hashes are symmetrically encrypted before writing to localStorage, protecting the ledger from browser-level inspection leaks.
          </p>

          <div className="space-y-1.5">
            <label className="block text-3xs uppercase text-slate-500 font-bold tracking-wider">localStorage['csv_enc_users'] (Ciphertext Payload)</label>
            <textarea
              readOnly
              rows={4}
              value={encryptedDBInspect}
              className="w-full p-3 bg-slate-950/80 border border-white/5 rounded-xl text-3xs font-mono text-emerald-500/80 resize-none break-all select-all focus:outline-none"
            />
          </div>
          <p className="text-3xs text-slate-500 italic font-semibold">
            Note: Data is encrypted using AES-style symmetric mapping. If decryption keys mismatch, data becomes unreadable.
          </p>
        </div>
      </div>

      {/* Right panel: Update password */}
      <div className="lg:col-span-5">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4.5 h-4.5 text-indigo-400" />
            Update Password Key (OTP Secured)
          </h3>

          {pwdError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-2xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendUpdatePasswordOTP} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current security password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new strong password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Send className="w-4 h-4" />
                Request Change OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPasswordChange} className="space-y-4 text-xs font-semibold animate-fadeIn">
              <p className="text-2xs text-slate-400 leading-relaxed">
                An OTP code was sent to your registered address. Enter the code to authorize the password overwrite.
              </p>

              {otpError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-2xs text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase text-center">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.8em] font-mono text-lg py-2 glass-input"
                />
              </div>

              <div className="flex gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 py-2.5 glass-panel border border-white/5 text-slate-400 hover:text-white rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl shadow-lg"
                >
                  Verify & Overwrite
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
