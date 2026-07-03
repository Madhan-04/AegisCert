import React, { useState, useEffect, useRef } from 'react';
import { db, Institution, AuditLog, User } from '../services/db';
import { blockchain } from '../services/blockchain';
import { Building, GraduationCap, FileText, CheckCircle2, XCircle, Clock, ShieldAlert, Cpu, Camera, RefreshCw, Scan, UserCheck, Edit3, X, Save, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  navigate: (route: string) => void;
}

export default function AdminDashboard({ navigate }: AdminDashboardProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blocksCount, setBlocksCount] = useState(0);
  const [totalCerts, setTotalCerts] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  // Biometrics enrollment modal states
  const [enrollUser, setEnrollUser] = useState<User | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);
  const [bioStatus, setBioStatus] = useState('');
  
  // Profile Editor modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBatch, setEditBatch] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load database state
  const loadData = () => {
    const insts = db.getInstitutions();
    const certs = db.getCertificates();
    const allUsers = db.getUsers();
    const ledger = blockchain.getLedger();

    setInstitutions(insts);
    setAuditLogs(db.getAuditLogs().slice(0, 5)); // Latest 5 logs
    setUsers(allUsers);
    setBlocksCount(ledger.length);
    setTotalCerts(certs.length);
    setTotalStudents(allUsers.filter(u => u.role === 'student').length);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = (id: string, name: string) => {
    const currentInsts = db.getInstitutions();
    const updated = currentInsts.map(i => {
      if (i.id === id) {
        return { ...i, status: 'approved' as const };
      }
      return i;
    });

    db.setInstitutions(updated);
    
    // Add audit log
    const adminUser = db.getCurrentUser();
    db.addAuditLog(
      adminUser?.id || 'admin', 
      adminUser?.name || 'Super Admin', 
      'admin', 
      'INSTITUTION_APPROVED', 
      `Approved university registration for "${name}"`, 
      'success'
    );

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });

    loadData();
  };

  const handleReject = (id: string, name: string) => {
    const currentInsts = db.getInstitutions();
    const updated = currentInsts.map(i => {
      if (i.id === id) {
        return { ...i, status: 'rejected' as const };
      }
      return i;
    });

    db.setInstitutions(updated);

    const adminUser = db.getCurrentUser();
    db.addAuditLog(
      adminUser?.id || 'admin', 
      adminUser?.name || 'Super Admin', 
      'admin', 
      'INSTITUTION_REJECTED', 
      `Rejected university registration for "${name}"`, 
      'success'
    );

    loadData();
  };

  // Profile editing functions
  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditContact(u.contact || '');
    setEditRollNo(u.rollNo || '');
    setEditRegNo(u.regNo || '');
    setEditDept(u.department || '');
    setEditBatch(u.batch || '');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const allDbUsers = db.getUsers();
    const updated = allDbUsers.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editName,
          email: editEmail,
          contact: editContact,
          rollNo: u.role === 'student' ? editRollNo : undefined,
          regNo: u.role === 'student' ? editRegNo : undefined,
          department: u.role === 'student' ? editDept : undefined,
          batch: u.role === 'student' ? editBatch : undefined
        };
      }
      return u;
    });

    db.setUsers(updated);

    const admin = db.getCurrentUser();
    db.addAuditLog(
      admin?.id || 'admin',
      admin?.name || 'Super Admin',
      'admin',
      'USER_PROFILE_UPDATED_BY_ADMIN',
      `Super Admin modified details for user ${editName} (${editingUser.role})`,
      'success'
    );

    alert('User profile details updated successfully.');
    setEditingUser(null);
    loadData();
  };

  // Biometrics Enrollment functions (Mantra fingerprint simulation)
  const startFingerprintCapture = () => {
    setBioStatus('Initializing Mantra MFS100 USB sensor capture...');
    triggerScanPipeline();
  };

  const triggerScanPipeline = () => {
    setBioScanning(true);
    let step = 0;
    const stages = [
      'Placing candidate finger on sensor lens...',
      'Capturing ridges characteristics (500 DPI)...',
      'Extracting ridge core coordinates...',
      'Matching against database template...',
      'Writing biometric lock to database registry...'
    ];

    const timer = setInterval(() => {
      if (step < stages.length) {
        setBioStatus(stages[step]);
        step++;
      } else {
        clearInterval(timer);
        completeEnrollment();
      }
    }, 700);
  };

  const completeEnrollment = () => {
    setBioScanning(false);

    if (!enrollUser) return;

    const allDbUsers = db.getUsers();
    const enrolledKey = `FINGER-Mantra-MFS100-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const updated = allDbUsers.map(u => {
      if (u.id === enrollUser.id) {
        return {
          ...u,
          faceEnrollId: enrolledKey, // Reused faceEnrollId database column for fingerprint token to avoid modifying backend logic schemas
          enrolledAt: new Date().toISOString()
        };
      }
      return u;
    });

    db.setUsers(updated);

    const admin = db.getCurrentUser();
    db.addAuditLog(
      admin?.id || 'admin',
      admin?.name || 'Super Admin',
      'admin',
      'USER_BIOMETRIC_ENROLLED_BY_ADMIN',
      `Super Admin registered/updated fingerprint biometrics credentials for ${enrollUser.name} (${enrollUser.role})`,
      'success'
    );

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 }
    });

    setEnrollUser(null);
    loadData();
  };

  useEffect(() => {
    if (enrollUser) {
      startFingerprintCapture();
    }
  }, [enrollUser]);

  const pendingInsts = institutions.filter(i => i.status === 'pending');
  const approvedInstsCount = institutions.filter(i => i.status === 'approved').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Super Admin Console</h1>
          <p className="text-sm text-slate-400">Manage approved credential issuers, verify system nodes, and review security audits.</p>
        </div>
        <button
          onClick={() => navigate('audit-logs')}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all"
        >
          View System Audits
        </button>
      </div>

      {/* Grid Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Approved</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{approvedInstsCount}</div>
            <div className="text-xs text-slate-400">Total Universities</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Verified</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{totalStudents}</div>
            <div className="text-xs text-slate-400">Total Students Enrolled</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Active</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{totalCerts}</div>
            <div className="text-xs text-slate-400">Credentials Issued</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Consensus</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{blocksCount}</div>
            <div className="text-xs text-slate-400">Mined Blocks Ledger</div>
          </div>
        </div>
      </section>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left approvals list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Pending Approvals ({pendingInsts.length})
              </h3>
              <span className="text-xs text-slate-500">Security check required</span>
            </div>

            {pendingInsts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No university registrations pending admin approval.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInsts.map(inst => (
                  <div key={inst.id} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <p>Registry ID: <span className="font-mono text-indigo-300">{inst.regNo}</span></p>
                        <p>Email: {inst.email}</p>
                        <p>Requested: {new Date(inst.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReject(inst.id, inst.name)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(inst.id, inst.name)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Audit Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Latest System Audits
            </h3>
            
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span className="capitalize font-bold text-slate-300">{log.userRole}: {log.userName}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-semibold">
                    Action: <span className="text-indigo-300">{log.action}</span>
                  </p>
                  <p className="text-slate-500">{log.details}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('audit-logs')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-900/80 border border-white/5 text-xs text-slate-400 hover:text-white rounded-xl transition-all"
            >
              Inspect Complete Audit Registry
            </button>
          </div>
        </div>
      </div>

      {/* Global Biometrics Enrollment Console */}
      <section className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Scan className="w-5 h-5 text-purple-400" />
              Biometrics Registry & Authorizations Directory
            </h3>
            <p className="text-2xs text-slate-400">Exclusively authorized to Super Admins and Accredited Institution registrars.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <div key={u.id} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex justify-between items-center gap-4 text-xs">
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm truncate">{u.name}</h4>
                <div className="text-2xs text-slate-500 font-semibold space-y-0.5">
                  <p>Username: <span className="font-mono text-indigo-300">{u.username}</span></p>
                  <p className="capitalize">Role Access Level: {u.role}</p>
                  {u.faceEnrollId ? (
                    <p className="text-emerald-400 font-mono flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      Fingerprint Lock: Secured
                    </p>
                  ) : (
                    <p className="text-amber-500 font-semibold">Fingerprint Lock: Pending Setup</p>
                  )}
                  <p>Secure MPIN Key: <span className={u.mpin ? 'text-emerald-400 font-bold' : 'text-amber-500 font-semibold'}>{u.mpin ? 'Configured' : 'Not Configured'}</span></p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => { setEnrollUser(u); setTimeout(() => startFingerprintCapture(), 100); }}
                  className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 hover:border-primary/40 text-2xs font-bold rounded-xl transition-all flex items-center gap-1 animate-glow"
                >
                  <Activity className="w-3.5 h-3.5" />
                  {u.faceEnrollId ? 'Update Bio' : 'Register Bio'}
                </button>
                <button
                  onClick={() => handleStartEditUser(u)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white text-2xs font-bold rounded-xl transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biometrics Fingerprint Scanner Overlay */}
      {enrollUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scaleUp relative overflow-hidden bg-slate-950/45">
            {bioScanning && <div className="scan-line" />}

            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="p-2.5 bg-primary/10 text-primary-light rounded-xl">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Enroll Fingerprint Ridges</h3>
                <p className="text-xs text-slate-400">Locking credentials for {enrollUser.name}</p>
              </div>
            </div>

            <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <Activity className={`w-14 h-14 ${bioScanning ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
              {bioScanning && <div className="scan-line" />}
              <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Mantra MFS100</span>
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-primary-light h-8 flex items-center justify-center">{bioStatus}</div>
              <p className="text-2xs text-slate-500">Instruct candidate to place finger on Mantra MFS100 USB scanner.</p>
            </div>

            <button
              onClick={() => setEnrollUser(null)}
              className="w-full py-2.5 premium-btn-secondary text-xs"
              disabled={bioScanning}
            >
              Cancel Enrollment
            </button>
          </div>
        </div>
      )}

      {/* User Profile Editor Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-300" />
                Edit Registrar Profile
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Display Name / Title</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase">Phone / Contact ID</label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="w-full px-4 py-2 glass-input text-xs"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Student specific fields */}
              {editingUser.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase">Student Roll Number</label>
                      <input
                        type="text"
                        required
                        value={editRollNo}
                        onChange={(e) => setEditRollNo(e.target.value)}
                        className="w-full px-4 py-2 glass-input text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase">Academic Reg Number</label>
                      <input
                        type="text"
                        required
                        value={editRegNo}
                        onChange={(e) => setEditRegNo(e.target.value)}
                        className="w-full px-4 py-2 glass-input text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase">Department Major</label>
                      <input
                        type="text"
                        required
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        className="w-full px-4 py-2 glass-input text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase">Batch Year</label>
                      <input
                        type="text"
                        required
                        value={editBatch}
                        onChange={(e) => setEditBatch(e.target.value)}
                        className="w-full px-4 py-2 glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 glass-panel border border-white/5 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Profiles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
