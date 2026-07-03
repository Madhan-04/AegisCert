import React, { useState, useEffect, useRef } from 'react';
import { db, Certificate, User } from '../services/db';
import { blockchain } from '../services/blockchain';
import { Landmark, Users, GraduationCap, FileText, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, ShieldAlert, Camera, RefreshCw, Edit3, X, Save } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstitutionDashboardProps {
  navigate: (route: string) => void;
}

export default function InstitutionDashboard({ navigate }: InstitutionDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  // Revocation Modal States
  const [revokingCert, setRevokingCert] = useState<Certificate | null>(null);
  const [reason, setReason] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [miningStatus, setMiningStatus] = useState('');

  // Biometrics Enrollment Modal States
  const [enrollUser, setEnrollUser] = useState<User | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);
  const [bioStatus, setBioStatus] = useState('');

  // Profile Editor Modal States
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBatch, setEditBatch] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadData = () => {
    const user = db.getCurrentUser();
    if (!user) return;
    
    setCurrentUser(user);

    // Get certificates issued by this institution
    const allCerts = db.getCertificates();
    const instCerts = allCerts.filter(c => c.institutionId === user.institutionId);
    setCertificates(instCerts);

    // Get students registered under this institution
    const allUsers = db.getUsers();
    const instStudents = allUsers.filter(u => u.role === 'student' && u.institutionId === user.institutionId);
    setStudents(instStudents);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeClick = (cert: Certificate) => {
    setRevokingCert(cert);
    setReason('');
  };

  const handleRevokeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingCert || !reason.trim() || !currentUser) return;

    setIsMining(true);
    setMiningStatus('Assembling revocation transaction...');

    // Simulate smart contract interaction and mining delay
    const tx = {
      txId: `tx-0x${Math.random().toString(16).slice(2, 14)}`,
      type: 'REVOKE' as const,
      certId: revokingCert.id,
      certHash: revokingCert.blockchainHash,
      studentName: revokingCert.studentName,
      issuerId: currentUser.institutionId || '',
      issuerName: currentUser.institutionName || '',
      timestamp: new Date().toISOString()
    };

    // Mine the transaction into a new block
    await blockchain.mineTransaction({
      type: 'REVOKE',
      certId: revokingCert.id,
      certHash: revokingCert.blockchainHash,
      studentName: revokingCert.studentName,
      issuerAddress: currentUser.institutionId || '',
      issuerName: currentUser.institutionName || ''
    }, (nonce: number, currentHash: string) => {
      setMiningStatus(`Mining block... Nonce: ${nonce} (Hash: ${currentHash.slice(0, 16)}...)`);
    });

    // Update certificate database status
    const allCerts = db.getCertificates();
    const updated = allCerts.map(c => {
      if (c.id === revokingCert.id) {
        const history = c.statusHistory || [];
        return {
          ...c,
          status: 'revoked' as const,
          revocationReason: reason,
          statusHistory: [
            ...history,
            { status: 'revoked' as const, timestamp: new Date().toISOString(), updatedBy: currentUser.name, reason }
          ]
        };
      }
      return c;
    });
    db.setCertificates(updated);

    // Audit logs
    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      'institution',
      'CREDENTIAL_REVOKED',
      `Revoked certificate ${revokingCert.id} of ${revokingCert.studentName}. Reason: ${reason}`,
      'success'
    );

    setIsMining(false);
    setRevokingCert(null);
    loadData();
  };

  // Profile Editor save functions
  const handleStartEditStudent = (s: User) => {
    setEditingStudent(s);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditContact(s.contact || '');
    setEditRollNo(s.rollNo || '');
    setEditRegNo(s.regNo || '');
    setEditDept(s.department || '');
    setEditBatch(s.batch || '');
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !currentUser) return;

    const allDbUsers = db.getUsers();
    const updated = allDbUsers.map(u => {
      if (u.id === editingStudent.id) {
        return {
          ...u,
          name: editName,
          email: editEmail,
          contact: editContact,
          rollNo: editRollNo,
          regNo: editRegNo,
          department: editDept,
          batch: editBatch
        };
      }
      return u;
    });

    db.setUsers(updated);

    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      'institution',
      'STUDENT_PROFILE_UPDATED_BY_UNIVERSITY',
      `University Registrar updated profile records for student ${editName} (${editRollNo})`,
      'success'
    );

    alert('Student profile records updated successfully.');
    setEditingStudent(null);
    loadData();
  };

  // Biometrics scan pipeline (Mantra fingerprint simulation)
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

    if (!enrollUser || !currentUser) return;

    const allDbUsers = db.getUsers();
    const enrolledKey = `FINGER-Mantra-MFS100-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const updated = allDbUsers.map(u => {
      if (u.id === enrollUser.id) {
        return {
          ...u,
          faceEnrollId: enrolledKey, // Reused database column to avoid backend schema updates
          enrolledAt: new Date().toISOString()
        };
      }
      return u;
    });

    db.setUsers(updated);

    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      'institution',
      'STUDENT_BIOMETRIC_ENROLLED_BY_INSTITUTION',
      `University Registrar registered/updated fingerprint biometrics credentials for ${enrollUser.name} (${enrollUser.rollNo})`,
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

  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{currentUser.institutionName}</h1>
          <p className="text-sm text-slate-400">Issue blockchain degrees, manage registrar lists, and authorize digital revocations.</p>
        </div>
        <button
          onClick={() => navigate('issuance')}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-102 flex items-center gap-2"
        >
          <FileText className="w-4.5 h-4.5" />
          Issue New Certificate
        </button>
      </div>

      {/* Analytics stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Registered</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{students.length}</div>
            <div className="text-xs text-slate-400">Total Enrolled Students</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Anchored</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{certificates.filter(c => c.status === 'active').length}</div>
            <div className="text-xs text-slate-400">Active Blockchain Certificates</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Invalid</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{certificates.filter(c => c.status === 'revoked').length}</div>
            <div className="text-xs text-slate-400">Revoked Degrees</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-2xs text-slate-500 font-bold">Success</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-slate-400">Validator Synchronization</div>
          </div>
        </div>
      </section>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left issued certs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Issued Digital Credentials ({certificates.length})
              </h3>
            </div>

            {certificates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No credentials issued yet. Issue your first blockchain diploma.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-500 uppercase border-b border-white/5">
                    <tr>
                      <th className="py-3 px-2">Cert ID</th>
                      <th className="py-3 px-2">Student Name</th>
                      <th className="py-3 px-2">Degree / Major</th>
                      <th className="py-3 px-2">Block Hash</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-2 font-mono text-xs text-indigo-300">{cert.id}</td>
                        <td className="py-4 px-2 font-bold text-white">{cert.studentName}</td>
                        <td className="py-4 px-2 text-xs">
                          <div>{cert.degree}</div>
                          <div className="text-slate-500 text-2xs">{cert.department}</div>
                        </td>
                        <td className="py-4 px-2 font-mono text-2xs text-slate-500" title={cert.blockchainHash}>
                          {cert.blockchainHash.slice(0, 8)}...{cert.blockchainHash.slice(-8)}
                        </td>
                        <td className="py-4 px-2">
                          {cert.status === 'active' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title={cert.revocationReason}>
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-right">
                          {cert.status === 'active' ? (
                            <button
                              onClick={() => handleRevokeClick(cert)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-2xs font-semibold rounded transition-all"
                            >
                              Revoke degree
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-600 font-semibold italic">Revoked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Student roster */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Registered Registrar List
            </h3>
            
            {students.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No students enrolled under this institution.
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate">{student.name}</h4>
                      <p className="text-slate-500 font-mono text-2xs truncate">{student.rollNo} • {student.department}</p>
                    </div>
                    
                    <div className="flex gap-1.5 shrink-0 ml-2">
                      {student.faceEnrollId ? (
                        <button
                          onClick={() => setEnrollUser(student)}
                          className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-3xs font-bold rounded-lg transition-all"
                        >
                          Bio Locked
                        </button>
                      ) : (
                        <button
                          onClick={() => setEnrollUser(student)}
                          className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 hover:border-primary/40 text-3xs font-bold rounded-lg transition-all"
                        >
                          Enroll
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEditStudent(student)}
                        className="px-2 py-1 bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-3xs font-bold rounded-lg transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revocation Confirmation Modal Overlay */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scaleUp relative overflow-hidden">
            {isMining && <div className="scan-line" />}
            
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Degree Revocation Request</h3>
                <p className="text-xs text-slate-400">Mines permanent revocation block</p>
              </div>
            </div>

            {isMining ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-dashed border-rose-500/30 border-t-rose-500 animate-spin mx-auto" />
                <div className="text-xs font-mono text-rose-400">{miningStatus}</div>
                <p className="text-2xs text-slate-500">Signing transaction payload and broadcasting to consensus validators...</p>
              </div>
            ) : (
              <form onSubmit={handleRevokeConfirm} className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Student: <span className="font-bold text-white">{revokingCert.studentName}</span></p>
                    <p>Degree: <span className="font-semibold text-slate-200">{revokingCert.degree}</span></p>
                    <p>ID Hash: <span className="font-mono text-rose-300">{revokingCert.id}</span></p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Revocation Reason</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter official reason (e.g. plagiarism check, record duplication correction...)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRevokingCert(null)}
                    className="flex-1 py-2.5 glass-panel border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/20"
                  >
                    Confirm & Publish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Biometrics Fingerprint Scanner Overlay Modal */}
      {enrollUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scaleUp relative overflow-hidden bg-slate-950/45">
            {bioScanning && <div className="scan-line" />}

            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="p-2.5 bg-primary/10 text-primary-light rounded-xl">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Enroll Student Fingerprint</h3>
                <p className="text-xs text-slate-400">Locking credentials for student {enrollUser.name}</p>
              </div>
            </div>

            <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
              <Users className={`w-14 h-14 ${bioScanning ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
              {bioScanning && <div className="scan-line" />}
              <span className="absolute bottom-2 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">Mantra MFS100</span>
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-primary-light h-8 flex items-center justify-center">{bioStatus}</div>
              <p className="text-2xs text-slate-500">Instruct student to place finger on Mantra MFS100 USB scanner.</p>
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

      {/* Student Profile Editor Modal Overlay */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-300" />
                Edit Student Registrar Record
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Student Full Name</label>
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
                <label className="block text-slate-400 uppercase">Contact Phone</label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="w-full px-4 py-2 glass-input text-xs"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

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
                  <label className="block text-slate-400 uppercase">Department / Major</label>
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

              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 glass-panel border border-white/5 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Student Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
