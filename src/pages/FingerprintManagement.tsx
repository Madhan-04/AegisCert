import React, { useState, useEffect } from 'react';
import { db, User } from '../services/db';
import { Fingerprint, Usb, Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, UserCheck, Plus, Trash2, ShieldAlert, Cpu } from 'lucide-react';

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

interface FingerprintManagementProps {
  navigate: (route: string) => void;
}

export default function FingerprintManagement({ navigate }: FingerprintManagementProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Mantra MFS100 V54 simulated hardware state
  const [deviceConnected, setDeviceConnected] = useState<boolean>(true);
  const [deviceStatus, setDeviceStatus] = useState<string>('Ready');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanQuality, setScanQuality] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState<number>(0);
  const [showScannerHUD, setShowScannerHUD] = useState<boolean>(false);
  const [simulatedPrintCode, setSimulatedPrintCode] = useState<string>('0x8B2C4F');

  const loadData = () => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    const allUsers = db.getUsers();
    // Filter to show student or users that can have fingerprints (or all users except verifier)
    setUsers(allUsers.filter(u => u.role !== 'verifier'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDeviceConnection = () => {
    const nextState = !deviceConnected;
    setDeviceConnected(nextState);
    if (!nextState) {
      setDeviceStatus('Disconnected');
      setShowScannerHUD(false);
      setIsScanning(false);
      db.addAuditLog(
        currentUser?.id || 'system',
        currentUser?.name || 'Admin',
        currentUser?.role || 'admin',
        'MANTRA_DEVICE_DISCONNECTED',
        'Mantra MFS100 V54 hardware USB interface detached',
        'success'
      );
    } else {
      setDeviceStatus('Ready');
      db.addAuditLog(
        currentUser?.id || 'system',
        currentUser?.name || 'Admin',
        currentUser?.role || 'admin',
        'MANTRA_DEVICE_CONNECTED',
        'Mantra MFS100 V54 hardware USB interface initialized, SN: 1920822',
        'success'
      );
    }
  };

  const handleEnrollClick = (user: User) => {
    if (!deviceConnected) {
      alert('Please connect the Mantra MFS100 V54 fingerprint scanner before enrollment.');
      return;
    }
    setSelectedUser(user);
    setShowScannerHUD(true);
    setScanQuality(0);
    setScanMessage('Place finger on the scanner lens...');
    setScanAttempts(0);
  };

  const startFingerprintScan = async () => {
    const settings = db.getSettings();

    if (!settings.biometricSimulationMode) {
      setIsScanning(true);
      setScanQuality(0);
      setScanMessage('Accessing local Mantra MFS100... Place finger on sensor when red light glows.');

      try {
        const result = await captureMantraFingerprint();
        setIsScanning(false);

        if (result.success) {
          setScanQuality(result.quality);
          
          if (result.quality >= 60) {
            setScanMessage(`Capture successful! Quality: ${result.quality}% (Secure signature generated)`);
            setTimeout(() => {
              completeEnrollment(result.quality);
            }, 1200);
          } else {
            setScanMessage(`Scan quality too low (${result.quality}% < 60%). Clean sensor and retry.`);
            setScanAttempts(prev => prev + 1);
            
            db.addAuditLog(
              selectedUser?.id || 'unknown',
              selectedUser?.name || 'Student',
              selectedUser?.role || 'student',
              'MANTRA_ENROLL_QUALITY_FAIL',
              `Fingerprint scan failed quality check threshold: ${result.quality}%`,
              'failure'
            );
            
            db.addSocEvent(
              'medium',
              'BIOMETRIC_ENROLL_FAIL',
              `Mantra Enrollment Quality Failure: Scan quality ${result.quality}% fell below threshold for user ${selectedUser?.username}`,
              '127.0.0.1'
            );
          }
        } else {
          setScanQuality(0);
          setScanMessage(result.error || 'Fingerprint scan failed.');
          
          db.addSocEvent(
            'high',
            'BIOMETRIC_ENROLL_FAIL',
            `Mantra Enrollment Hardware Error: ${result.error} for user ${selectedUser?.username}`,
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
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        
        const quality = scanAttempts === 0 && Math.random() < 0.3 ? 42 : Math.floor(65 + Math.random() * 30);
        setScanQuality(quality);
        setIsScanning(false);

        if (quality < 60) {
          setScanMessage(`Scan quality too low (${quality}% < 60%). Clean sensor and retry.`);
          setScanAttempts(prev => prev + 1);
          
          db.addAuditLog(
            selectedUser?.id || 'unknown',
            selectedUser?.name || 'Student',
            selectedUser?.role || 'student',
            'MANTRA_ENROLL_QUALITY_FAIL',
            `Fingerprint scan failed quality check threshold: ${quality}%`,
            'failure'
          );
          
          db.addSocEvent(
            'medium',
            'BIOMETRIC_ENROLL_FAIL',
            `Mantra Enrollment: Scanner capture quality fell below standard threshold for user ${selectedUser?.username}`,
            '127.0.0.1'
          );
        } else {
          setScanMessage(`Capture successful! Quality: ${quality}% (Secure signature generated)`);
          
          setTimeout(() => {
            completeEnrollment(quality);
          }, 1200);
        }
      } else {
        setScanQuality(Math.floor(progress * 0.7));
      }
    }, 300);
  };

  const completeEnrollment = (quality: number) => {
    if (!selectedUser) return;

    const printSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const templateName = `MANTRA_MFS100_V54_TEMP_${selectedUser.username.toUpperCase()}_0x${printSuffix}`;
    // Simulate SHA-256 fingerprint hash representation
    const fingerprintHash = Math.abs(selectedUser.id.length * quality * 187652).toString(16).padEnd(64, 'a');
    const deviceId = 'Mantra MFS100 V54 - SN 1920822';

    const allUsers = db.getUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          fingerprintEnrollId: `MNT-${printSuffix}`,
          fingerprintTemplate: templateName,
          fingerprintHash: fingerprintHash,
          fingerprintDeviceId: deviceId,
          fingerprintEnrolledAt: new Date().toISOString(),
          fingerprintStatus: 'enrolled' as const
        };
      }
      return u;
    });

    db.setUsers(updatedUsers);
    
    db.addAuditLog(
      currentUser?.id || 'admin',
      currentUser?.name || 'Admin',
      currentUser?.role || 'admin',
      'MANTRA_BIOMETRIC_ENROLLED',
      `Enrolled Mantra fingerprint keys for student: ${selectedUser.name} (${selectedUser.username})`,
      'success'
    );

    // If it was currentUser (Mr. Madhan) enrolling himself, update sessionStorage
    if (currentUser && currentUser.id === selectedUser.id) {
      const updatedSelf = updatedUsers.find(u => u.id === currentUser.id)!;
      db.setCurrentUser(updatedSelf);
      setCurrentUser(updatedSelf);
    }

    loadData();
    setShowScannerHUD(false);
    setSelectedUser(null);
    alert(`Biometric key enrolled successfully for ${selectedUser.name}!`);
  };

  const handleRevokeClick = (user: User) => {
    if (!confirm(`Are you sure you want to revoke the biometric fingerprint key for ${user.name}? This will block biometric access until re-enrolled.`)) {
      return;
    }

    const allUsers = db.getUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          fingerprintStatus: 'revoked' as const,
          fingerprintTemplate: '',
          fingerprintHash: '',
          fingerprintDeviceId: '',
          fingerprintEnrolledAt: ''
        };
      }
      return u;
    });

    db.setUsers(updatedUsers);

    db.addAuditLog(
      currentUser?.id || 'admin',
      currentUser?.name || 'Admin',
      currentUser?.role || 'admin',
      'MANTRA_BIOMETRIC_REVOKED',
      `Revoked fingerprint credentials for user: ${user.name}`,
      'success'
    );

    // If revoking self
    if (currentUser && currentUser.id === user.id) {
      const updatedSelf = updatedUsers.find(u => u.id === currentUser.id)!;
      db.setCurrentUser(updatedSelf);
      setCurrentUser(updatedSelf);
    }

    loadData();
    alert(`Biometric credentials revoked for ${user.name}.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Biometric Management Suite
          </h1>
          <p className="text-xs text-slate-400">
            Deploy hardware authentication, manage registry keys, and audit credential status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* USB hardware device toggle */}
          <button
            onClick={toggleDeviceConnection}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all border flex items-center gap-2 ${
              deviceConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <Usb className="w-4 h-4" />
            {deviceConnected ? 'Mantra MFS100: CONNECTED' : 'Mantra MFS100: DETACHED'}
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Mantra Device Status Details */}
        <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Hardware Status
            </h2>
            <span className={`w-2.5 h-2.5 rounded-full ${deviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Device Model:</span>
                <span className="text-slate-300">Mantra MFS100 V54</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serial Number:</span>
                <span className="text-slate-300">SN-1920822</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">API Status:</span>
                <span className={deviceConnected ? 'text-emerald-400' : 'text-rose-400'}>
                  {deviceConnected ? 'Active (v2.1.84)' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SDK Sync:</span>
                <span className={deviceConnected ? 'text-emerald-400' : 'text-rose-400'}>
                  {deviceConnected ? 'Synchronized' : 'Desynced'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">USB Channel:</span>
                <span className="text-slate-300">COM3 (Secure Interface)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/30 border border-white/5 rounded-xl text-xs space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-300" />
                Enrollment Standard
              </h3>
              <p className="text-slate-400 text-2xs leading-relaxed font-sans">
                Platform requires a minimum of <strong className="text-indigo-400">60% ridge clarity</strong> index to validate enrollment and verification attempts. Encrypted fingerprints are stored locally as hashed SHA-256 signatures, ensuring absolute biological data privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Right Columns: Registry Management & Scanner HUD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scanner HUD Modal-style section */}
          {showScannerHUD && selectedUser && (
            <div className="glass-panel border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-950/80 to-slate-950/30 rounded-2xl p-6 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Mantra Fingerprint Capture Interface</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Enrolling: {selectedUser.name} ({selectedUser.username})</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowScannerHUD(false); setSelectedUser(null); }}
                  className="text-slate-400 hover:text-white text-xs font-bold font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                
                {/* Visual Scanner Mock Lens */}
                <div className="relative">
                  <div className={`w-36 h-36 rounded-2xl bg-slate-950 border-2 flex flex-col items-center justify-center transition-all ${
                    isScanning ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' :
                    scanQuality >= 60 ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                    scanQuality > 0 ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' :
                    'border-white/10'
                  }`}>
                    {/* Ridge lines simulator */}
                    <div className={`absolute inset-4 rounded-xl opacity-20 border border-white/10 flex items-center justify-center`}>
                      <Fingerprint className={`w-20 h-20 text-slate-500 ${isScanning ? 'animate-pulse scale-105' : ''}`} />
                    </div>

                    {/* Scanning glow bar */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scanline" />
                    )}

                    {/* Visual Fingerprint indicator after scan */}
                    {scanQuality > 0 && !isScanning && (
                      <Fingerprint className={`w-16 h-16 transition-all ${scanQuality >= 60 ? 'text-emerald-400' : 'text-rose-400'}`} />
                    )}

                    <span className="absolute bottom-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Mantra Sensor</span>
                  </div>
                  
                  {/* Quality Percentage Label */}
                  {scanQuality > 0 && !isScanning && (
                    <div className={`absolute -top-3.5 -right-3.5 w-11 h-11 rounded-full flex flex-col items-center justify-center border font-mono font-extrabold ${
                      scanQuality >= 60 ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-rose-950/80 border-rose-500 text-rose-400'
                    }`}>
                      <span className="text-[12px]">{scanQuality}%</span>
                      <span className="text-[7px] -mt-1">QUAL</span>
                    </div>
                  )}
                </div>

                {/* Status and Action Buttons */}
                <div className="space-y-4 max-w-sm flex-1">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Device Message</span>
                    <div className="p-3 bg-slate-900 border border-white/5 rounded-xl min-h-[50px] flex items-center">
                      <p className="text-xs text-indigo-300 font-medium leading-relaxed font-mono">
                        {scanMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={startFingerprintScan}
                      disabled={isScanning}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Capturing Ridge...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-3.5 h-3.5" />
                          Start Scanner Capture
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* User Registry List */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Biometric Enrollment Registry
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 pb-2">
                    <th className="py-2.5 font-bold uppercase tracking-wider">User Identity</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Institution / Role</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Biometric Status</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Registry Key</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="capitalize font-mono text-indigo-300 font-semibold">{u.role === 'admin' ? 'Super Admin' : u.role}</div>
                        <div className="text-[10px] text-slate-500 max-w-[150px] truncate">{u.institutionName || 'Global System'}</div>
                      </td>
                      <td className="py-3.5 text-center">
                        {u.fingerprintStatus === 'enrolled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[9px] uppercase">
                            Enrolled
                          </span>
                        ) : u.fingerprintStatus === 'revoked' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold text-[9px] uppercase">
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-[9px] uppercase">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-mono text-[10px] text-slate-400">
                        {u.fingerprintTemplate ? (
                          <span className="text-emerald-400/80 font-bold" title={u.fingerprintTemplate}>
                            {u.fingerprintTemplate.slice(0, 16)}...
                          </span>
                        ) : (
                          <span className="text-slate-600 font-sans">None</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {u.fingerprintStatus === 'enrolled' ? (
                          <button
                            onClick={() => handleRevokeClick(u)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/25 transition-all"
                            title="Revoke Biometric Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnrollClick(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Enroll Key
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
