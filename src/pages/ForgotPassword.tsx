import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Phone, Lock } from 'lucide-react';
import { db, hashPassword } from '../services/db';

interface ForgotPasswordProps {
  navigate: (route: string) => void;
}

export default function ForgotPassword({ navigate }: ForgotPasswordProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: request, 2: verify otp, 3: reset pwd, 4: success
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchedUser, setMatchedUser] = useState<any>(null);

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = db.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === emailOrPhone.trim().toLowerCase() || 
      (u.contact && u.contact.replace(/\s+/g, '') === emailOrPhone.trim().replace(/\s+/g, ''))
    );

    if (user) {
      setMatchedUser(user);
      const target = user.email || user.contact || '';
      db.sendOTP(target, user.id, user.username).then(() => {
        setStep(2);
        db.addAuditLog(user.id, user.name, user.role, 'PASSWORD_RECOVERY_OTP_REQUEST', `Requested OTP for password restoration for ${target}`, 'success');
      });
    } else {
      setError('No registered credential holder matches this email or phone number.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const target = matchedUser.email || matchedUser.contact || '';
    const success = await db.verifyOTP(target, otpInput, matchedUser.id);

    if (success) {
      setStep(3);
      db.addAuditLog(matchedUser.id, matchedUser.name, matchedUser.role, 'PASSWORD_RECOVERY_OTP_VERIFIED', 'OTP successfully verified for password change authorization', 'success');
    } else {
      setError('Invalid OTP code. Please verify the code sent to your device.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Save update in encrypted database and server
    db.resetPassword(matchedUser.username, matchedUser.role, newPassword).then(success => {
      if (success) {
        const users = db.getUsers();
        const updated = users.map(u => {
          if (u.id === matchedUser.id) {
            return { ...u, password: hashPassword(newPassword) };
          }
          return u;
        });

        db.setUsers(updated);
        db.addAuditLog(matchedUser.id, matchedUser.name, matchedUser.role, 'PASSWORD_RECOVERY_COMPLETE', 'Access password reset complete using OTP verification', 'success');
        setStep(4);
      } else {
        setError('Failed to update password on server.');
      }
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-darkBg text-slate-100 flex flex-col justify-center items-center px-6 py-12 cyber-grid">
      <div className="glow-orb w-[400px] h-[400px] bg-primary/10 top-[15%] left-[20%]" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent/10 bottom-[15%] right-[20%]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3 cursor-pointer" onClick={() => navigate('landing')}>
          <img src="/logo.jpg" className="w-16 h-16 rounded-2xl object-cover shadow-xl mx-auto border border-white/10" />
          <h2 className="text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-primary-light font-sans">
            AEGIS<span className="text-accent font-light">CERT</span>
          </h2>
          <p className="text-xs text-slate-400">Security Access Recovery Console</p>
        </div>

        {/* Glass panel */}
        <div className="glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl">
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-primary-light" />
                Recover Password
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered mobile phone number or email ID. We will generate a secure OTP validation token to verify identity.
              </p>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Registered Mobile / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. madhan@aegiscert.gov or +1 (555) 019-8822"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Send Verification OTP
              </button>

              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
                Return to Access Authorization
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent-light" />
                OTP Security Challenge
              </h3>
              <p className="text-xs text-slate-400">
                A verification code has been dispatched. Enter the 6-digit OTP code below to confirm identity.
              </p>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] font-mono text-lg py-2.5 glass-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-accent to-primary text-white font-semibold rounded-xl transition-all"
              >
                Authorize OTP Code
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = matchedUser.email || matchedUser.contact || '';
                  db.sendOTP(target);
                }}
                className="w-full text-xs text-primary-light hover:underline font-semibold"
              >
                Resend OTP Verification SMS
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-light" />
                Set Access Password
              </h3>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">New Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all"
              >
                Reset Password Key
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-5 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Access Restored</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Your cryptographic login credentials have been updated. You can now log in securely.
              </p>
              <button
                onClick={() => navigate('login')}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
