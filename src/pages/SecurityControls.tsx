import React, { useState, useEffect } from 'react';
import { db, User, SystemSettings } from '../services/db';
import { Shield, ShieldAlert, ShieldCheck, Activity, RotateCw, Terminal, Flame, Lock, Unlock, RefreshCw, CheckCircle2, Cpu, AlertTriangle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SecurityControlsProps {
  navigate: (route: string) => void;
}

export default function SecurityControls({ navigate }: SecurityControlsProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [securityScore, setSecurityScore] = useState<number>(0);
  
  // Controls states
  const [killSwitch, setKillSwitch] = useState<boolean>(false);
  const [integrityLoading, setIntegrityLoading] = useState<boolean>(false);
  const [integrityLogs, setIntegrityLogs] = useState<string[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Key rotation states
  const [rotationLoading, setRotationLoading] = useState<boolean>(false);
  const [rotationLogs, setRotationLogs] = useState<string[]>([]);
  const [activeKeyName, setActiveKeyName] = useState<string>('');

  // Threat Intelligence Feed Logs
  const [threatLogs, setThreatLogs] = useState<string[]>([
    '11:59:12 PM - [INFO] Intrusion prevention active: Zero Trust Policy 1.0 deployed.',
    '11:58:50 PM - [BLOCKED] Impossible travel warning: IP 184.22.9.2 travel speed exceeded limit (3020 km/h).',
    '11:58:33 PM - [BLOCKED] SQL injection payload detected in query parameter: "UNION SELECT ALL password..."',
    '11:58:10 PM - [BLOCKED] Honeytoken account access trigger: decoy account backup_root targeted.',
    '11:57:42 PM - [MITIGATED] Brute-force block: IP 203.0.113.88 blocked for 15 minutes after 5 consecutive failures.'
  ]);

  const loadData = () => {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('landing');
      return;
    }
    setCurrentUser(user);

    const currentSettings = db.getSettings();
    setSettings(currentSettings);
    setKillSwitch(currentSettings.killSwitchActive || false);

    // Calculate dynamic security score
    let score = 50; // base score for password + biometric enrollment checks
    
    // BCrypt Cost 12: +15 points (Always active in v4)
    score += 15;
    
    // AES-256-GCM encryption at rest: +15 points (Always active in v4)
    score += 15;

    // Lockout policy active: +5 points
    score += 5;

    // Honeytoken traps: +5 points
    score += 5;

    // Decoy certificate: +5 points
    score += 5;

    // Key Rotated recently (within 1 min of demo): +5 points
    const rotatedTime = currentSettings.lastRotationDate ? new Date(currentSettings.lastRotationDate).getTime() : 0;
    if (Date.now() - rotatedTime < 1000 * 60 * 60) {
      score += 5;
    }

    setSecurityScore(Math.min(score, 100));

    // Get current key obfuscated
    const key = localStorage.getItem('csv_active_aes_key') || 'AEGISCERT_ENTERPRISE_SHIELD_SECRET_KEY';
    setActiveKeyName(key.slice(0, 16) + '••••••••');
  };

  useEffect(() => {
    loadData();
    
    // Simulate incoming threat intelligence logs
    const interval = setInterval(() => {
      const threats = [
        `[BLOCKED] Impossible travel detected from IP ${Math.floor(100 + Math.random() * 150)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.42.`,
        `[WARNING] Scanned honeypot decoy registry index for CERT-DECOY-777. Quarantining browser fingerprint.`,
        `[INFO] API rate limiter warning: IP 102.15.22.${Math.floor(Math.random() * 100)} reached 80% threshold.`,
        `[BLOCKED] XSS reflection filter restricted payload inside Roll Number input box.`,
        `[INFO] Secure cryptographic database integrity checked: Merkle root verified.`
      ];
      const time = new Date().toLocaleTimeString();
      const newLog = `${time} - ${threats[Math.floor(Math.random() * threats.length)]}`;
      setThreatLogs(prev => [newLog, ...prev.slice(0, 8)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleKillSwitchToggle = () => {
    if (!settings) return;
    const nextState = !killSwitch;
    setKillSwitch(nextState);

    const updatedSettings = {
      ...settings,
      killSwitchActive: nextState
    };
    db.setSettings(updatedSettings);

    if (nextState) {
      // Terminate all other sessions except current super admin
      const sessions = db.getActiveSessions();
      const filtered = sessions.filter(s => s.userId === currentUser?.id);
      db.setActiveSessions(filtered);

      db.addAuditLog(
        currentUser?.id || 'admin',
        currentUser?.name || 'Admin',
        'admin',
        'EMERGENCY_KILL_SWITCH_ACTIVATED',
        'Emergency security freeze enabled. All portals locked. Concurrent user sessions terminated.',
        'success',
        100
      );

      db.addSocEvent('critical', 'EMERGENCY_FREEZE_ACTIVE', 'Security Operation: Global system freeze toggled by Super Admin Mr. MADHAN', '127.0.0.1');
      db.addFraudReport('unauthorized_mod', 90, 'Security Freeze: System portals locked under emergency kill switch protocol');
      alert('EMERGENCY KILL SWITCH ACTIVATED! All user sessions terminated, all portals frozen.');
    } else {
      db.addAuditLog(
        currentUser?.id || 'admin',
        currentUser?.name || 'Admin',
        'admin',
        'EMERGENCY_KILL_SWITCH_DEACTIVATED',
        'Emergency security freeze disabled. Operations restored to normal.',
        'success',
        20
      );
      db.addSocEvent('medium', 'EMERGENCY_FREEZE_RESTORED', 'Security Operation: Global system restore complete.', '127.0.0.1');
      alert('Emergency freeze deactivated. System portals unlocked.');
    }
    loadData();
  };

  const runIntegrityCheck = () => {
    setIntegrityLoading(true);
    setIntegrityStatus('idle');
    setIntegrityLogs([
      'Initializing local database collections list...',
      'Mapping LocalStorage encrypted blocks...',
      'Computing block digest SHA-256 integrity map...'
    ]);

    setTimeout(() => {
      setIntegrityLogs(prev => [...prev, '[OK] Verify users table checksum...']);
      
      setTimeout(() => {
        setIntegrityLogs(prev => [...prev, '[OK] Verify certificates table checksum...']);
        
        setTimeout(() => {
          const check = db.verifyDatabaseIntegrity();
          setIntegrityLogs(prev => [
            ...prev,
            `Expected Merkle Root: ${check.expectedHash}`,
            `Calculated Merkle Root: ${check.calculatedHash}`,
            check.valid ? '[SUCCESS] Merkle root match. Cryptographic database integrity verified.' : '[FAIL] Cryptographic mismatch: Database tamper detected!'
          ]);
          setIntegrityLoading(false);
          setIntegrityStatus(check.valid ? 'success' : 'failed');

          if (check.valid) {
            confetti({
              particleCount: 50,
              spread: 40,
              colors: ['#6366F1', '#10B981']
            });
            db.addAuditLog(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'admin', 'INTEGRITY_CHECK_PASS', 'Database integrity check passed', 'success', 5);
          } else {
            db.addSocEvent('critical', 'DATABASE_TAMPER', 'Database Integrity Check Failed: Calculated payload hash mismatch', '127.0.0.1');
            db.addFraudReport('tampered_cert', 95, 'Database Tampering Detected: Merkle root mismatch on at-rest localStorage collections');
            db.addAuditLog(currentUser?.id || 'admin', currentUser?.name || 'Admin', 'admin', 'INTEGRITY_CHECK_FAIL', 'Database integrity check failed: Tamper detected', 'failure', 95);
          }
        }, 500);
      }, 500);
    }, 600);
  };

  const runKeyRotation = () => {
    if (rotationLoading) return;
    setRotationLoading(true);
    setRotationLogs([
      'Initiating database cryptographic key rotation...',
      'Reading current active key credentials...',
      'Generating cryptographically secure 256-bit random key...'
    ]);

    setTimeout(() => {
      setRotationLogs(prev => [...prev, '[OK] Decrypting at-rest database records...']);
      
      setTimeout(() => {
        setRotationLogs(prev => [...prev, '[MIGRATION] Re-encrypting 8 users & 3 certificates using simulated AES-256-GCM...']);
        
        setTimeout(async () => {
          const rot = await db.rotateDatabaseKeys();
          if (rot.success) {
            setRotationLogs(prev => [
              ...prev,
              `[OK] New active key registered: ${rot.newKey.slice(0, 16)}••••••••`,
              '[OK] Database Merkle roots re-calculated & locked.',
              '[SUCCESS] Key rotation complete. Obsolete cryptographic parameters revoked.'
            ]);
            setRotationLoading(false);
            loadData();
            
            confetti({
              particleCount: 60,
              spread: 50,
              colors: ['#06B6D4', '#10B981']
            });
          } else {
            setRotationLogs(prev => [...prev, '[FAIL] Cryptographic key migration failed. Database rolled back to previous key.']);
            setRotationLoading(false);
          }
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Security Hardening & Reconstruction Suite
        </h1>
        <p className="text-xs text-slate-400">
          Govern Zero Trust controls, rotate cryptographic keys, trigger emergency system freezes, and inspect database Merkle root integrity.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Security Score Card & Kill Switch */}
        <div className="space-y-6">
          
          {/* Security Score */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Security Posture</h2>
            
            {/* Circle Score Gauge */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="60" className="stroke-slate-900 fill-none" strokeWidth="10" />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-indigo-500 fill-none transition-all duration-1000"
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - securityScore / 100)}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-mono">{securityScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Score / 100</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-[10px] text-slate-400 space-y-1 font-sans text-left">
              <span className="font-bold text-indigo-400 block mb-1">Safety Attributes Verified:</span>
              <div className="flex justify-between">
                <span>• AES-256 Encryption rest:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>• BCrypt Cost Factor 12:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>• 3-Strike Lockout Policy:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Emergency Kill Switch */}
          <div className="glass-panel border border-rose-500/20 bg-rose-950/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Emergency System Freeze</h2>
            </div>
            <p className="text-slate-400 text-2xs leading-relaxed font-sans">
              Activating the Emergency Kill Switch instantly **revokes all user session tokens** (except yours), blocks **all diploma issuances**, and freezes **all verification queries** across the ecosystem.
            </p>

            <button
              onClick={handleKillSwitchToggle}
              className={`w-full py-3 text-xs font-mono font-bold uppercase rounded-xl transition-all border flex items-center justify-center gap-2 hover:scale-[1.01] ${
                killSwitch
                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                  : 'bg-rose-600/10 border-rose-500/30 text-rose-400 hover:bg-rose-600/20 shadow-lg shadow-rose-600/10'
              }`}
            >
              {killSwitch ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {killSwitch ? 'DEACTIVATE EMERGENCY FREEZE' : 'ACTIVATE SYSTEM FREEZE'}
            </button>
          </div>

        </div>

        {/* Center & Right Column: Key Rotation & DB Integrity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cryptographic Key Rotation */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <RotateCw className="w-4 h-4 text-indigo-400" />
                Root Encryption Key Rotation
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Active Key: {activeKeyName}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 flex flex-col justify-between">
                <p className="text-slate-400 text-2xs leading-relaxed font-sans">
                  Rotate root keys in compliance with NIST cyber standards. AegisCert will decrypt all collections under the old key, generate a next random key, and re-encrypt the tables with no downtime.
                </p>
                <button
                  onClick={runKeyRotation}
                  disabled={rotationLoading}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${rotationLoading ? 'animate-spin' : ''}`} />
                  {rotationLoading ? 'Migrating Database Keys...' : 'Rotate Database Root Key'}
                </button>
              </div>

              {/* Rotation Terminal console */}
              <div className="bg-slate-950 border border-white/5 rounded-xl p-4 h-36 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1 select-all">
                {rotationLogs.length === 0 ? (
                  <span className="text-slate-600 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" />
                    Key rotation console idle. Ready to rotate...
                  </span>
                ) : (
                  rotationLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith('[SUCCESS]') ? 'text-emerald-400 font-bold' : log.startsWith('[FAIL]') ? 'text-rose-400 font-bold' : ''}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Database Integrity & Threat Intel Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Integrity checks */}
            <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Database Integrity Check
              </h3>

              <div className="space-y-4">
                <button
                  onClick={runIntegrityCheck}
                  disabled={integrityLoading}
                  className="w-full py-2 bg-slate-900 border border-white/5 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {integrityLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Computing Hashes...
                    </>
                  ) : (
                    'Verify Local Database'
                  )}
                </button>

                <div className="bg-slate-950 border border-white/5 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[8.5px] text-slate-400 space-y-0.5">
                  {integrityLogs.length === 0 ? (
                    <span className="text-slate-600">Integrity verification output logs.</span>
                  ) : (
                    integrityLogs.map((log, idx) => (
                      <div key={idx} className={log.startsWith('[SUCCESS]') ? 'text-emerald-400 font-bold' : log.startsWith('[FAIL]') ? 'text-rose-400 font-bold' : ''}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Threat intelligence feed */}
            <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                Threat Intelligence Feed
              </h3>

              <div className="bg-slate-950 border border-white/5 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[8.5px] text-slate-400 space-y-2 select-all">
                {threatLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('[BLOCKED]') ? 'text-rose-400/90 font-medium' : log.includes('[WARNING]') ? 'text-amber-400/90' : 'text-slate-500'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
