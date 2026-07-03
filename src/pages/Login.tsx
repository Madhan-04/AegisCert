import React, { useState, useRef, useEffect } from 'react';
import { Shield, Eye, Lock, User as UserIcon, AlertCircle, RefreshCw, Fingerprint, CheckCircle2, Usb, Activity, Cpu, ShieldAlert, Key } from 'lucide-react';
import { db, User, hashPassword } from '../services/db';
import AntigravityBackground from '../components/AntigravityBackground';

// Helper for real Mantra MFS100 RD Service Capture
const captureMantraFingerprint = async (): Promise<{ success: boolean; quality: number; error?: string }> => {
  const pidOptionsXml = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="0" iCount="0" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="15000" otp="" wadh="" posh="" env="P" />
</PidOptions>`;

  const ports = [11100, 11101, 11102];
  let lastErrorMsg = '';
  let xmlText = '';
  let contacted = false;

  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/rd/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'text/xml'
        },
        body: pidOptionsXml
      });
      if (res.ok) {
        xmlText = await res.text();
        contacted = true;
        break;
      }
    } catch (err: any) {
      lastErrorMsg = err.message;
      // Try fallback CAPTURE method
      try {
        const res = await fetch(`http://127.0.0.1:${port}/rd/capture`, {
          method: 'CAPTURE',
          headers: {
            'Content-Type': 'text/xml',
            'Accept': 'text/xml'
          },
          body: pidOptionsXml
        });
        if (res.ok) {
          xmlText = await res.text();
          contacted = true;
          break;
        }
      } catch (err2: any) {
        lastErrorMsg = err2.message;
      }
    }
  }

  if (!contacted) {
    return {
      success: false,
      quality: 0,
      error: `Mantra MFS100 Connection Failed: RD Service not found on localhost ports 11100-11102. Please ensure the Mantra driver is installed.`
    };
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const respNode = xmlDoc.getElementsByTagName("Resp")[0];
    
    if (!respNode) {
      return { success: false, quality: 0, error: "Invalid response format from Mantra RD service." };
    }

    const errCode = respNode.getAttribute("errCode");
    const errInfo = respNode.getAttribute("errInfo") || "Unknown hardware error";
    
    if (errCode === "0") {
      const qScore = parseInt(respNode.getAttribute("qScore") || "0", 10);
      return { success: true, quality: qScore };
    } else {
      return { success: false, quality: 0, error: `Hardware Error (Code ${errCode}): ${errInfo}` };
    }
  } catch (e: any) {
    return { success: false, quality: 0, error: `Failed to parse response: ${e.message}` };
  }
};

interface LoginProps {
  navigate: (route: string) => void;
  onLoginSuccess: (user: any) => void;
}

export default function Login({ navigate, onLoginSuccess }: LoginProps) {
  const [role, setRole] = useState<'admin' | 'institution' | 'student' | 'verifier'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Authentication Stages:
  // 'credentials' -> 'mpin_setup' -> 'mpin_entry' -> 'fingerprint' -> 'anchoring_fingerprint'
  const [loginStage, setLoginStage] = useState<'credentials' | 'mpin_setup' | 'mpin_entry' | 'fingerprint' | 'anchoring_fingerprint'>('credentials');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Biometric device status (can be toggled in HUD for simulation)
  const [deviceConnected, setDeviceConnected] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanQuality, setScanQuality] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string>('');

  // MPIN fields
  const [mpinInput, setMpinInput] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

  // MPIN Auto-Submit verification
  useEffect(() => {
    if (loginStage === 'mpin_entry' && mpinInput.length === 6 && pendingUser) {
      setError('');
      const hashed = hashPassword(mpinInput);
      if (pendingUser.mpin === hashed) {
        if (pendingUser.fingerprintStatus === 'enrolled') {
          setLoginStage('fingerprint');
          setScanMessage('MPIN authorized. Place finger on Mantra MFS100 scanner to finalize session.');
        } else {
          db.addAuditLog(pendingUser.id, pendingUser.name, pendingUser.role, 'USER_LOGIN_MPIN', 'Successfully authorized login session via Password + 6-digit MPIN', 'success');
          onLoginSuccess(pendingUser);
        }
      } else {
        setError('Invalid 6-digit MPIN. Access Denied.');
        setMpinInput(''); // Clear input on failure
        db.addAuditLog(pendingUser.id, pendingUser.name, pendingUser.role, 'MPIN_VERIFICATION_FAILED', 'Incorrect MPIN code verification attempt', 'failure');
        db.addSocEvent('high', 'MPIN_AUTH_FAIL', `Security Alert: MPIN verification failure on account ${pendingUser.username}`, '127.0.0.1');
      }
    }
  }, [mpinInput, loginStage, pendingUser]);

  // Keyboard listener for MPIN
  useEffect(() => {
    if (loginStage !== 'mpin_entry') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setMpinInput(prev => {
          if (prev.length < 6) return prev + e.key;
          return prev;
        });
      } else if (e.key === 'Backspace') {
        setMpinInput(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [loginStage]);

  // Submit Password credentials
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // 1. Check Emergency Kill Switch Status
      const settings = db.getSettings();
      if (settings.killSwitchActive) {
        setIsLoading(false);
        setError('Emergency Lockout Active: System operations are frozen by administrative mandate.');
        db.addSocEvent('critical', 'LOGIN_BLOCKED_FREEZE', `Login attempt on account ${username} blocked due to active Emergency Freeze`, '127.0.0.1');
        return;
      }

      // 2. Check Honeytoken Decoy Intrusion Traps
      if (username.toLowerCase() === 'backup_root' || username.toLowerCase() === 'database_root') {
        setIsLoading(false);
        setError('Access Denied: Security Node Mismatch.');
        
        // Dispatch intrusion logs
        db.addAuditLog('honeytoken-trap', username, 'admin', 'HONEYTOKEN_ACCESS_ATTEMPT', `Decoy honeytoken account ${username} was targeted`, 'failure', 99);
        db.addSocEvent('critical', 'INTRUSION_HONEYTOKEN', `Intrusion Alert: Decoy honeytoken account ${username} accessed from IP 127.0.0.1`, '127.0.0.1');
        db.addFraudReport('suspicious_login', 99, `Honeypot Trap: Unauthorized access attempt on administrative daemon account: ${username}`);
        return;
      }

      const users = db.getUsers();
      const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);

      // 3. Check Account Lockout Policy
      if (foundUser && foundUser.lockedUntil) {
        const lockTime = new Date(foundUser.lockedUntil).getTime();
        if (lockTime > Date.now()) {
          setIsLoading(false);
          const minutesRemaining = Math.ceil((lockTime - Date.now()) / (60 * 1000));
          setError(`Account locked due to 3 failed authorization attempts. Try again in ${minutesRemaining} minutes.`);
          db.addAuditLog(foundUser.id, foundUser.name, foundUser.role, 'LOGIN_LOCKED_OUT', `Login blocked: account currently locked`, 'failure', 60);
          return;
        }
      }

      // 4. Validate Credentials
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashPassword(password) && u.role === role);

      if (user) {
        setIsLoading(false);
        setPendingUser(user);

        // Reset failure counter on success
        if (user.failedLoginAttempts || user.lockedUntil) {
          const updatedUsers = users.map(u => {
            if (u.id === user.id) {
              return { ...u, failedLoginAttempts: 0, lockedUntil: undefined };
            }
            return u;
          });
          db.setUsers(updatedUsers);
        }

        // Check if user has an MPIN set up
        if (!user.mpin) {
          setLoginStage('mpin_setup');
          setMpinInput('');
          setMpinConfirm('');
        } else {
          setLoginStage('mpin_entry');
          setMpinInput('');
        }
      } else {
        setIsLoading(false);
        
        // 5. Brute Force Protection (Staging failures)
        if (foundUser) {
          const newFailures = (foundUser.failedLoginAttempts || 0) + 1;
          const updatedUsers = users.map(u => {
            if (u.id === foundUser.id) {
              const uUpdated = { ...u, failedLoginAttempts: newFailures };
              if (newFailures >= 3) {
                uUpdated.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                uUpdated.failedLoginAttempts = 0; // Reset counter for next cycle
              }
              return uUpdated;
            }
            return u;
          });
          db.setUsers(updatedUsers);

          if (newFailures >= 3) {
            setError('Account locked out for 15 minutes due to 3 failed authorization attempts.');
            db.addSocEvent('high', 'ACCOUNT_LOCKOUT', `Brute Force Blocked: Account ${username} locked out after 3 failures`, '127.0.0.1');
            db.addFraudReport('suspicious_login', 80, `Brute Force Prevention: Lockout active on user account: ${username}`);
          } else {
            setError(`Invalid username or password for this security level. Attempt ${newFailures} of 3.`);
            db.addAuditLog(foundUser.id, foundUser.name, foundUser.role, 'LOGIN_FAILED', `Incorrect password input (Attempt ${newFailures} of 3)`, 'failure');
          }
        } else {
          setError('Invalid username or password for this security level.');
          db.addAuditLog('unknown', username, role, 'LOGIN_FAILED', 'Incorrect password key input', 'failure');
        }
      }
    }, 600);
  };

  // Triggered when completing first-time fingerprint anchoring enrollment
  const performFirstTimeBiometricEnroll = (quality: number) => {
    if (!pendingUser) return;

    const printSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const templateName = `MANTRA_MFS100_V54_TEMP_MADHAN_0x${printSuffix}`;
    const fingerprintHash = hashPassword(`MADHAN-${quality}-${printSuffix}`);
    const deviceId = 'Mantra MFS100 V54 - SN 1920822';

    const users = db.getUsers();
    const updated = users.map(u => {
      if (u.id === pendingUser.id) {
        return {
          ...u,
          fingerprintEnrollId: `MNT-${printSuffix}`,
          fingerprintTemplate: templateName,
          fingerprintHash: fingerprintHash,
          fingerprintDeviceId: deviceId,
          fingerprintEnrolledAt: new Date().toISOString(),
          fingerprintStatus: 'enrolled' as const,
          enrolledAt: new Date().toISOString()
        };
      }
      return u;
    });

    db.setUsers(updated);

    db.addAuditLog(
      pendingUser.id,
      pendingUser.name,
      pendingUser.role,
      'MANTRA_FIRST_TIME_BIOMETRIC_ANCHORING',
      'Completed biometric (Mantra Fingerprint) anchoring alongside secure 6-digit MPIN on first-time login',
      'success'
    );

    const finalUser = updated.find(u => u.id === pendingUser.id)!;
    onLoginSuccess(finalUser);
  };

  const handleMpinSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mpinInput.length !== 6 || !/^\d+$/.test(mpinInput)) {
      setError('MPIN must be exactly 6 numeric digits.');
      return;
    }

    if (mpinInput !== mpinConfirm) {
      setError('MPIN and Confirm MPIN codes do not match.');
      return;
    }

    if (!pendingUser) return;

    // Save hashed MPIN to database
    const hashed = hashPassword(mpinInput);
    const users = db.getUsers();
    const updated = users.map(u => {
      if (u.id === pendingUser.id) {
        return {
          ...u,
          mpin: hashed
        };
      }
      return u;
    });

    db.setUsers(updated);
    db.addAuditLog(pendingUser.id, pendingUser.name, pendingUser.role, 'MPIN_SETUP_COMPLETED', 'Configured secure 6-digit MPIN for identity authorization', 'success');

    const updatedUser = updated.find(u => u.id === pendingUser.id)!;
    setPendingUser(updatedUser);

    // If fingerprint anchoring is required (admin first time)
    if (updatedUser.fingerprintStatus === 'pending') {
      setLoginStage('anchoring_fingerprint');
      setScanMessage('Secure MPIN registered. Please place finger on Mantra MFS100 scanner to anchor fingerprint biometric.');
    } else {
      // Proceed to login success
      db.addAuditLog(updatedUser.id, updatedUser.name, updatedUser.role, 'USER_LOGIN', 'Session authorized successfully via Password + MPIN setup', 'success');
      onLoginSuccess(updatedUser);
    }
  };

  // Simulated/Real Mantra Fingerprint Scan for Verification/Enrollment
  const handleFingerprintScan = async (simulateSuccess: boolean) => {
    const settings = db.getSettings();

    if (!settings.biometricSimulationMode) {
      // Real Mantra physical scanner check
      setIsScanning(true);
      setScanQuality(0);
      setScanMessage('Accessing local Mantra MFS100... Place finger on optical scanner.');

      try {
        const result = await captureMantraFingerprint();
        setIsScanning(false);

        if (result.success) {
          setScanQuality(result.quality);
          
          if (result.quality >= 60) {
            setScanMessage(`Fingerprint matched! Quality: ${result.quality}%`);
            
            setTimeout(() => {
              if (loginStage === 'anchoring_fingerprint') {
                performFirstTimeBiometricEnroll(result.quality);
              } else if (pendingUser) {
                db.addAuditLog(
                  pendingUser.id,
                  pendingUser.name,
                  pendingUser.role,
                  'USER_LOGIN_MULTIMODAL',
                  `Successfully completed real hardware (Mantra MFS100) biometric verification with quality ${result.quality}%`,
                  'success'
                );
                onLoginSuccess(pendingUser);
              }
            }, 1200);
          } else {
            setScanMessage(`Scan quality too low (${result.quality}% < 60%). Please try again.`);
            db.addSocEvent('medium', 'BIOMETRIC_LOW_QUALITY', `Mantra scan quality fell below threshold (Quality: ${result.quality}%) for user ${pendingUser?.username || username}`, '127.0.0.1');
          }
        } else {
          setScanQuality(0);
          setScanMessage(result.error || 'Fingerprint scan failed.');
          
          db.addAuditLog(
            pendingUser?.id || 'unknown',
            pendingUser?.name || username,
            role,
            'MANTRA_HARDWARE_ERROR',
            `Mantra biometric scan error: ${result.error}`,
            'failure'
          );

          db.addSocEvent(
            'high',
            'BIOMETRIC_DEVICE_ERROR',
            `Biometric Hardware Error: ${result.error} on user account: ${username}`,
            '127.0.0.1'
          );
        }
      } catch (err: any) {
        setIsScanning(false);
        setScanQuality(0);
        setScanMessage(`Unexpected hardware scan error: ${err.message}`);
      }
      return;
    }

    // Bypass / Simulation Mode
    setIsScanning(true);
    setScanQuality(0);
    setScanMessage('Scanning fingerprint ridges...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);

        if (!simulateSuccess) {
          // Simulate spoof/failure
          setScanQuality(38);
          setScanMessage('Fingerprint scan failed: Template mismatch or poor scan quality.');
          
          db.addAuditLog(
            pendingUser?.id || 'unknown',
            pendingUser?.name || username,
            role,
            'MANTRA_VERIFY_MISMATCH_SPOOF',
            'Mantra fingerprint scan mismatch detected during security login check',
            'failure'
          );

          // SOC Alert & AI Fraud triggers
          db.addSocEvent(
            'critical',
            'BIOMETRIC_SPOOF',
            `Biometric Spoof Prevention: Unrecognized fingerprint ridges scan attempt on user account: ${username}`,
            '127.0.0.1'
          );

          db.addFraudReport(
            'biometric_spoof',
            98,
            `High risk biometric spoof attempt. Mantra fingerprint signature mismatch on account: ${username}`
          );

          setTimeout(() => {
            setError('Biometric authentication failed. Incident logged to security logs.');
            setLoginStage('credentials');
            setPendingUser(null);
          }, 1500);

        } else {
          // Success
          setScanQuality(88);
          setScanMessage('Fingerprint matched! Generating session token...');

          setTimeout(() => {
            if (loginStage === 'anchoring_fingerprint') {
              performFirstTimeBiometricEnroll(88);
            } else if (pendingUser) {
              db.addAuditLog(
                pendingUser.id,
                pendingUser.name,
                pendingUser.role,
                'USER_LOGIN_MULTIMODAL',
                'Successfully completed simulated multimodal login validation',
                'success'
              );
              onLoginSuccess(pendingUser);
            }
          }, 1200);
        }
      } else {
        setScanQuality(Math.floor(progress * 0.8));
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden cyber-grid">
      {/* Antigravity floating dots backdrop */}
      <AntigravityBackground />

      {/* Left Decorative branding panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10 border-r border-white/5 bg-slate-950/40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('landing')}>
          <img src="/logo.jpg" className="w-10 h-10 rounded-2xl object-cover shadow-xl border border-white/10" />
          <span className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-light">
            AEGIS<span className="text-accent font-light">CERT</span>
          </span>
        </div>

        <div className="space-y-6 max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary-light uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            Zero Trust Verification Engine
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Secure Decentralized <br />
            Academic Trust.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Authorized portal utilizing one-way cryptographic SHA-256 ledgers, secure 6-digit MPIN credentials, and physical Mantra fingerprint authorization protocols.
          </p>

          {/* Connected ledger statistics */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div>
              <div className="text-xl font-bold text-white">256-bit</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Ledger Hash</div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">Nominal</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Security Seals</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          AegisCert Platform © {new Date().getFullYear()}. Government-Grade Academic Custody Node.
        </div>
      </div>

      {/* Right form card panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header (Only visible on mobile/tablet) */}
          <div className="text-center space-y-3 cursor-pointer lg:hidden" onClick={() => navigate('landing')}>
            <img src="/logo.jpg" className="w-12 h-12 rounded-2xl object-cover shadow-xl mx-auto border border-white/10" />
            <h2 className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-primary-light font-sans">
              AEGIS<span className="text-accent font-light">CERT</span>
            </h2>
            <p className="text-2xs text-slate-400 uppercase tracking-widest">Zero Trust Node authorization</p>
          </div>

          {/* Form Card wrapper */}
          <div className="premium-card p-8 border border-white/10 shadow-2xl relative overflow-hidden bg-slate-950/40">
          
          {/* Diagnostic status line for scanning */}
          {(loginStage !== 'credentials') && <div className="scan-line" />}

          {/* Stage: 6-Digit MPIN Entry */}
          {loginStage === 'mpin_entry' && pendingUser && (
            <div className="space-y-6 text-center animate-fadeIn">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
                <Key className="w-4 h-4 text-indigo-400 animate-pulse" />
                MPIN Session Authorization
              </h3>
              <p className="text-2xs text-slate-400 leading-normal">
                Enter your 6-digit security MPIN to authorize access for <span className="text-white font-bold">{pendingUser.name}</span>.
              </p>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                  {error}
                </div>
              )}

              {/* 6 circle indicators */}
              <div className="flex justify-center gap-3 my-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      i < mpinInput.length
                        ? 'bg-indigo-400 border-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)] scale-110'
                        : 'bg-transparent border-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (mpinInput.length < 6) {
                        setMpinInput(prev => prev + num);
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 text-white hover:bg-slate-800 active:scale-95 text-base font-bold transition-all flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMpinInput('')}
                  className="w-12 h-12 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold transition-all flex items-center justify-center"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mpinInput.length < 6) {
                      setMpinInput(prev => prev + '0');
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 text-white hover:bg-slate-800 active:scale-95 text-base font-bold transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setMpinInput(prev => prev.slice(0, -1))}
                  className="w-12 h-12 rounded-full bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold transition-all flex items-center justify-center"
                >
                  Del
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setLoginStage('credentials'); setPendingUser(null); setError(''); }}
                className="text-2xs text-slate-500 hover:text-slate-400 uppercase tracking-wider font-bold"
              >
                Cancel & Reset
              </button>
            </div>
          )}

          {/* Stage: 6-Digit MPIN Setup */}
          {loginStage === 'mpin_setup' && pendingUser && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Establish Security MPIN
                </h3>
                <p className="text-2xs text-slate-400">
                  Welcome, <span className="text-white font-bold">{pendingUser.name}</span>. Configure a 6-digit PIN code to secure your cabinet node.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleMpinSetupSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-widest">New 6-Digit MPIN</label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={mpinInput}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setMpinInput(e.target.value);
                    }}
                    className="w-full text-center px-4 py-2.5 glass-input text-lg font-mono tracking-[0.75em] text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-widest">Confirm 6-Digit MPIN</label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={mpinConfirm}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setMpinConfirm(e.target.value);
                    }}
                    className="w-full text-center px-4 py-2.5 glass-input text-lg font-mono tracking-[0.75em] text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save and Initialize Node
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginStage('credentials'); setPendingUser(null); setError(''); }}
                  className="w-full py-1 text-2xs text-slate-500 hover:text-slate-400 uppercase tracking-wider font-bold text-center"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Stage: Mantra Fingerprint Scan (Verification or Enrollment) */}
          {(loginStage === 'fingerprint' || loginStage === 'anchoring_fingerprint') && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-indigo-400 animate-pulse" />
                  Mantra Biometric Authentication
                </h3>
                {/* USB Simulation toggle */}
                <button
                  onClick={() => setDeviceConnected(!deviceConnected)}
                  className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    deviceConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {deviceConnected ? 'USB: Link OK' : 'USB: Detached'}
                </button>
              </div>

              {/* Mantra Sensor Mock Lens */}
              <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center transition-all">
                <Fingerprint className={`w-16 h-16 ${isScanning ? 'text-indigo-400 animate-pulse' : scanQuality >= 60 ? 'text-emerald-400' : 'text-slate-600'}`} />
                
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-indigo-400/90 animate-scanline" />
                )}

                {scanQuality > 0 && !isScanning && (
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                    scanQuality >= 60 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {scanQuality}% Qual
                  </div>
                )}
                
                <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Mantra MFS100</span>
              </div>

              <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-center min-h-[48px] flex items-center justify-center">
                <p className="text-[10px] text-slate-400 font-mono leading-normal">
                  {scanMessage}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!db.getSettings().biometricSimulationMode ? (
                  <button
                    type="button"
                    onClick={() => handleFingerprintScan(true)}
                    disabled={isScanning}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning physical ridges...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 text-cyan-300 animate-pulse" />
                        Scan Fingerprint from Mantra MFS100
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleFingerprintScan(true)}
                      disabled={isScanning}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                    >
                      {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      [Simulate] Verify Registered Fingerprint
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleFingerprintScan(false)}
                      disabled={isScanning}
                      className="w-full py-2.5 bg-slate-900 border border-rose-500/20 hover:bg-rose-950/10 text-rose-400 hover:text-rose-300 disabled:text-slate-600 disabled:border-white/5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      [Simulate] Spoof / Mismatched Finger
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => { setLoginStage('credentials'); setPendingUser(null); setError(''); }}
                  className="w-full py-2 text-2xs text-slate-500 hover:text-slate-400 transition-all uppercase tracking-wider font-bold"
                >
                  Cancel & Reset
                </button>
              </div>
            </div>
          )}

          {/* Stage: Traditional Password Form entry */}
          {loginStage === 'credentials' && (
            <>
              {/* Role Select Tabs */}
              <div className="flex border-b border-white/5 pb-4 mb-6 text-2xs font-bold uppercase justify-between tracking-wider">
                {(['admin', 'institution', 'student', 'verifier'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`pb-2 border-b-2 transition-all ${role === r ? 'text-primary-light border-primary' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                  >
                    {r === 'admin' ? 'Super Admin' : r === 'institution' ? 'University' : r}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-widest">Security Identity ID</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder={role === 'admin' ? 'madhan' : 'Enter security ID'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 premium-input text-sm font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-widest">Access Passkey</label>
                    <button
                      type="button"
                      onClick={() => navigate('forgot-password')}
                      className="text-2xs text-primary-light hover:underline font-bold uppercase tracking-wider"
                    >
                      Recover?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 premium-input text-sm font-mono text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-secondary-light text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating Nodes...
                    </>
                  ) : (
                    'Authorize Security Node'
                  )}
                </button>
              </form>
            </>
          )}

          </div>

          {/* Footer links */}
          <div className="mt-8 text-center text-xs text-slate-500">
            <span>Need a node license? </span>
            <button onClick={() => navigate('register')} className="text-primary-light hover:underline font-semibold">
              Register Institution Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
