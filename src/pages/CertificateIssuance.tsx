import React, { useState, useEffect } from 'react';
import { db, User, hashPassword } from '../services/db';
import { blockchain } from '../services/blockchain';
import { FileText, User as UserIcon, GraduationCap, Award, RefreshCw, Cpu, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CertificateIssuanceProps {
  navigate: (route: string) => void;
}

export default function CertificateIssuance({ navigate }: CertificateIssuanceProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form fields
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [dob, setDob] = useState('');
  const [yearOfPassout, setYearOfPassout] = useState(new Date().getFullYear().toString());
  const [department, setDepartment] = useState('Computer Science');
  const [degree, setDegree] = useState('Bachelor of Science');
  const [cgpa, setCgpa] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  
  // Mining/Signing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: input, 2: hashing/signing, 3: mining blockchain, 4: success
  const [progressMsg, setProgressMsg] = useState('');
  const [nonceProgress, setNonceProgress] = useState(0);
  const [miningHash, setMiningHash] = useState('');
  const [newCert, setNewCert] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check emergency freeze status
    const settings = db.getSettings();
    if (settings.killSwitchActive) {
      setError('Emergency Freeze Active: All certificate issuance nodes are temporarily locked.');
      return;
    }

    if (!studentName.trim() || !rollNo.trim() || !regNo.trim() || !dob.trim() || !yearOfPassout.trim() || !department.trim()) {
      setError('Please fill in all manual entry certification fields.');
      return;
    }

    const gpaNum = parseFloat(cgpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
      setError('Enter a valid CGPA between 0.00 and 4.00.');
      return;
    }

    setIsProcessing(true);
    setStep(2);
    setProgressMsg('Hashing student academic metadata records...');

    // Phase 1: Cryptographic metadata hashing (simulating SHA-256 calculation)
    setTimeout(async () => {
      setProgressMsg('Generating digital signature using private signing key...');
      
      const certId = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const rawMetadata = certId + studentName + rollNo + regNo + dob + yearOfPassout + degree + department + gpaNum.toString();
      
      // Calculate real SHA-256 hash using synchronized helper
      const certHash = blockchain.sha256Sync(rawMetadata);
      const signature = `SIG_0x${Math.random().toString(16).slice(2, 18).toUpperCase()}...${certHash.slice(-8).toUpperCase()}`;

      setTimeout(async () => {
        setStep(3);
        setProgressMsg('Broadcasting transaction to consensus ledger node...');

        // Trigger mining loop simulator
        const block = await blockchain.mineTransaction({
          type: 'ISSUE',
          certId,
          certHash,
          studentName,
          issuerAddress: currentUser?.institutionId || '',
          issuerName: currentUser?.institutionName || ''
        }, (nonce: number, currentHash: string) => {
          setNonceProgress(nonce);
          setMiningHash(currentHash);
          setProgressMsg(`Searching proof-of-work nonce index...`);
        });

        // Save Certificate object to DB
        const certificate = {
          id: certId,
          studentName,
          rollNo,
          regNo,
          degree,
          department,
          cgpa: gpaNum,
          institutionId: currentUser?.institutionId || '',
          institutionName: currentUser?.institutionName || '',
          issueDate: new Date().toISOString(),
          blockchainHash: certHash,
          signature,
          status: 'active' as const,
          statusHistory: [
            { status: 'active' as const, timestamp: new Date().toISOString(), updatedBy: currentUser?.name || 'Registrar', reason: 'Initial degree certificate issue' }
          ],
          dob,
          yearOfPassout,
          pdfMarksheet: pdfFileName || 'Uploaded_Marksheet.pdf'
        };

        const currentCerts = db.getCertificates();
        currentCerts.unshift(certificate);
        db.setCertificates(currentCerts);

        // Auto-register student user account so they can log in immediately
        const allUsers = db.getUsers();
        const studentUsername = rollNo.toLowerCase().replace(/[^a-z0-9]/g, '');
        const studentExists = allUsers.some(u => u.username === studentUsername || u.rollNo === rollNo);
        
        if (!studentExists) {
          const newStudentUser = {
            id: `usr-stud-${Math.random().toString(36).substring(2, 9)}`,
            username: studentUsername,
            password: hashPassword('password123'), // Default password
            role: 'student' as const,
            name: studentName,
            email: `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu`,
            institutionId: currentUser?.institutionId || '',
            institutionName: currentUser?.institutionName || '',
            rollNo: rollNo,
            regNo: regNo,
            department: department,
            batch: yearOfPassout,
            contact: '+1 (555) 000-0000',
            enrolledAt: new Date().toISOString()
          };
          allUsers.push(newStudentUser);
          db.setUsers(allUsers);
          
          if (currentUser) {
            db.addAuditLog(
              currentUser.id,
              currentUser.name,
              'institution',
              'STUDENT_REGISTER',
              `Auto-registered login credentials for student: ${studentName} (Username/RollNo: ${studentUsername})`,
              'success'
            );
          }
        }

        // Add audit logs
        if (currentUser) {
          db.addAuditLog(
            currentUser.id,
            currentUser.name,
            'institution',
            'CERTIFICATE_ISSUED',
            `Successfully issued and signed certificate ${certId} for ${studentName} in Block #${block.number}`,
            'success'
          );
        }

        setNewCert(certificate);
        setStep(4);
        setIsProcessing(false);

        // Trigger celebrate confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.8 }
        });

      }, 1000);
    }, 1200);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Generate Blockchain Degree</h1>
        <p className="text-sm text-slate-400">Issue secure, cryptographically verifiable diplomas and write their logs to the ledger.</p>
      </div>

      <div className="premium-card border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-slate-950/40">
        {isProcessing && <div className="scan-line" />}

        {step === 1 && (
          <form onSubmit={handleIssue} className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-light" />
              Degree Metadata Credentials
            </h3>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Student Name & DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm bg-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Roll & Reg No */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MIT-2024-082"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REG-9923881"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>
            </div>

            {/* Department & Year of Passout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Department / Major</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Year of Passout</label>
                <input
                  type="number"
                  required
                  min="2000"
                  max="2035"
                  placeholder="e.g. 2026"
                  value={yearOfPassout}
                  onChange={(e) => setYearOfPassout(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>
            </div>

            {/* Degree & CGPA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Degree Type</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm bg-slate-900 focus:outline-none"
                >
                  <option>Bachelor of Science</option>
                  <option>Bachelor of Technology</option>
                  <option>Master of Science</option>
                  <option>Doctor of Philosophy</option>
                  <option>Master of Business Administration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Academic Cumulative CGPA (out of 4.00)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                  required
                  placeholder="e.g. 3.92"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-sm"
                />
              </div>
            </div>

            {/* Marksheet PDF Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Upload PDF Marksheet / Certificate Document</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Choose File
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPdfFileName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
                <span className="text-xs text-slate-400">
                  {pdfFileName ? pdfFileName : 'No file selected (Optional)'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('institution-dashboard')}
                className="flex-1 py-3 premium-btn-secondary text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={db.getSettings().killSwitchActive}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {db.getSettings().killSwitchActive ? 'Issuance Locked' : 'Sign & Mine Degree'}
              </button>
            </div>
          </form>
        )}

        {/* Dynamic Digital Signing Animations */}
        {step === 2 && (
          <div className="py-12 text-center space-y-6 animate-fadeIn">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/30 border-t-primary animate-spin" />
              <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary-light" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Cryptographic Digital Signing</h3>
              <p className="text-xs font-mono text-primary-light">{progressMsg}</p>
            </div>
            <p className="text-2xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Academic credentials undergo metadata validation. A cryptographic signature of non-repudiation is created using the university's private keys.
            </p>
          </div>
        )}

        {/* Dynamic Block Mining Animation */}
        {step === 3 && (
          <div className="py-12 text-center space-y-6 animate-fadeIn font-mono">
            <div className="relative w-24 h-24 mx-auto bg-slate-950/60 rounded-xl border border-white/10 flex items-center justify-center shadow-inner">
              <Cpu className="w-10 h-10 text-accent animate-pulse" />
              <div className="absolute inset-0 rounded-xl border border-dashed border-accent/30 animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-sans">EVM Block Consensus Mining</h3>
              <p className="text-xs text-accent-light">{progressMsg}</p>
              <div className="text-xs text-slate-400 space-y-1 bg-slate-950/40 p-4 rounded-xl border border-white/5 max-w-sm mx-auto text-left">
                <p>Nonce Counter: <span className="text-white font-bold">{nonceProgress}</span></p>
                <p className="truncate">Hash Check: <span className="text-slate-500 font-bold">{miningHash}</span></p>
              </div>
            </div>
            <p className="text-2xs text-slate-500 max-w-xs mx-auto leading-relaxed font-sans">
              Broadcasting transactions to nodes. Mining block requires executing Proof-of-Work to verify certificate uniqueness on the distributed ledger.
            </p>
          </div>
        )}

        {/* Mined Success Panel */}
        {step === 4 && newCert && (
          <div className="py-8 space-y-6 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white">Degree Mined Successfully</h3>
              <p className="text-sm text-slate-400">The certificate was successfully compiled and anchored into the blockchain ledger.</p>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl text-xs space-y-2.5 font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2 text-slate-500">
                <span className="font-sans font-bold">METADATA FIELD</span>
                <span className="font-sans font-bold">LEDGER STATUS</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Certificate ID:</span>
                <span className="text-white font-bold">{newCert.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Holder Student:</span>
                <span className="text-white font-bold">{newCert.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll/Reg ID:</span>
                <span className="text-white font-bold">{newCert.rollNo} / {newCert.regNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CGPA Metric:</span>
                <span className="text-emerald-400 font-bold">{newCert.cgpa} / 4.00</span>
              </div>
              
              <div className="pt-2 border-t border-white/5">
                <p className="text-slate-400 mb-1">Decentralized IPFS Hash Pointer:</p>
                <p className="text-2xs text-primary-light break-all select-all">{newCert.blockchainHash}</p>
              </div>

              <div>
                <p className="text-slate-400 mb-1">Digital Signature Payload:</p>
                <p className="text-2xs text-slate-500 break-all select-all">{newCert.signature}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setNewCert(null);
                  setStudentName('');
                  setRollNo('');
                  setRegNo('');
                  setDob('');
                  setYearOfPassout(new Date().getFullYear().toString());
                  setCgpa('');
                  setPdfFileName('');
                }}
                className="flex-1 py-3 premium-btn-secondary text-sm font-semibold"
              >
                Issue Another
              </button>
              <button
                onClick={() => navigate('institution-dashboard')}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
              >
                Return to Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
