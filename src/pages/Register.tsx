import React, { useState } from 'react';
import { Shield, User, Building, Landmark, Mail, Lock, Phone, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db, hashPassword } from '../services/db';

interface RegisterProps {
  navigate: (route: string) => void;
}

export default function Register({ navigate }: RegisterProps) {
  const [role, setRole] = useState<'institution' | 'student' | 'verifier'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Student specific
  const [rollNo, setRollNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [dept, setDept] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedInst, setSelectedInst] = useState('');

  // Institution specific
  const [regLicense, setRegLicense] = useState('');

  // Status flags
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if username already exists
    const users = db.getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setError('This username is already registered in the credential ledger.');
      return;
    }

    const userId = `usr-${Date.now()}`;

    if (role === 'institution') {
      // Create a pending institution first
      const instId = `inst-${Date.now()}`;
      const newInst = {
        id: instId,
        name: name,
        regNo: regLicense,
        email: email,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      
      const currentInsts = db.getInstitutions();
      currentInsts.push(newInst);
      db.setInstitutions(currentInsts);

      // Create institution admin user
      const newUser = {
        id: userId,
        username: username,
        password: hashPassword(password),
        role: 'institution' as const,
        name: `${name} Representative`,
        email: email,
        institutionId: instId,
        institutionName: name
      };

      const currentUsers = db.getUsers();
      currentUsers.push(newUser);
      db.setUsers(currentUsers);

      db.addAuditLog(userId, newUser.name, 'institution', 'INSTITUTION_REGISTER', `Registered university "${name}" (license ID: ${regLicense}) - Pending Admin approval`, 'success');
      setSuccess(true);
    } else if (role === 'student') {
      const institutions = db.getInstitutions().filter(i => i.status === 'approved');
      const inst = institutions.find(i => i.id === selectedInst);

      const newUser = {
        id: userId,
        username,
        password: hashPassword(password),
        role: 'student' as const,
        name,
        email,
        institutionId: selectedInst,
        institutionName: inst ? inst.name : '',
        rollNo,
        regNo,
        department: dept,
        batch,
        contact: phone,
        enrolledAt: new Date().toISOString()
      };

      const currentUsers = db.getUsers();
      currentUsers.push(newUser);
      db.setUsers(currentUsers);

      db.addAuditLog(userId, name, 'student', 'STUDENT_REGISTER', `Registered student roll number ${rollNo} for ${inst?.name || 'unknown university'}`, 'success');
      setSuccess(true);
    } else {
      // Verifier
      const newUser = {
        id: userId,
        username,
        password: hashPassword(password),
        role: 'verifier' as const,
        name,
        email,
        contact: phone
      };

      const currentUsers = db.getUsers();
      currentUsers.push(newUser);
      db.setUsers(currentUsers);

      db.addAuditLog(userId, name, 'verifier', 'VERIFIER_REGISTER', `Registered verifier account for employer checking`, 'success');
      setSuccess(true);
    }
  };

  const approvedInstitutions = db.getInstitutions().filter(i => i.status === 'approved');

  return (
    <div className="min-h-screen relative overflow-hidden bg-darkBg text-slate-100 flex flex-col justify-center items-center px-6 py-12 cyber-grid">
      <div className="glow-orb w-[500px] h-[500px] bg-primary/10 top-[5%] left-[10%]" />
      <div className="glow-orb w-[500px] h-[500px] bg-accent/10 bottom-[5%] right-[10%]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-3 cursor-pointer" onClick={() => navigate('landing')}>
          <img src="/logo.jpg" className="w-16 h-16 rounded-2xl object-cover shadow-xl mx-auto border border-white/10" />
          <h2 className="text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-primary-light font-sans">
            AEGIS<span className="text-accent font-light">CERT</span>
          </h2>
          <p className="text-xs text-slate-400">Initialize Ledger Credentials Profile</p>
        </div>

        {/* Form Container */}
        <div className="glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          {success ? (
            <div className="text-center py-8 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Registration Complete</h3>
              
              {role === 'institution' ? (
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your university license has been queued for Super Admin validation. Once approved, you can log in to issue cryptographic certificates.
                </p>
              ) : (
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your credentials have been written to the system database. You can now log in and configure your biometric identity key.
                </p>
              )}

              <button
                onClick={() => navigate('login')}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Role Select Tabs */}
              <div className="flex border-b border-white/5 pb-4 mb-6 text-xs font-semibold justify-between">
                {(['student', 'institution', 'verifier'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError('');
                    }}
                    className={`pb-2 border-b-2 transition-all capitalize ${role === r ? 'text-primary-light border-primary' : 'text-slate-400 border-transparent hover:text-white'}`}
                  >
                    {r === 'institution' ? 'University / Institution' : r}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                      {role === 'institution' ? 'University Name' : 'Full Name'}
                    </label>
                    <div className="relative">
                      {role === 'institution' ? (
                        <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      ) : (
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder={role === 'institution' ? 'e.g. Stanford University' : 'e.g. Jane Doe'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. registrar@domain.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Username / ID</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Choose unique username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Password Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Create strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Role specific inputs */}
                {role === 'institution' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Regulatory Registry License ID</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. US-STAN-2034"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>
                )}

                {role === 'student' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Select University</label>
                        <select
                          required
                          value={selectedInst}
                          onChange={(e) => setSelectedInst(e.target.value)}
                          className="w-full px-3 py-2 glass-input text-sm bg-slate-900"
                        >
                          <option value="">Select approved university</option>
                          {approvedInstitutions.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Contact Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="+1 (555) 000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Student Roll Number</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. MIT-2024-082"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Academic Registration Number</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. REG-9923881"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Department / Major</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Computer Science"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                          className="w-full px-4 py-2 glass-input text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Batch Year</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2022-2026"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          className="w-full px-4 py-2 glass-input text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === 'verifier' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-input text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
                >
                  Create Ledger Account
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <span>Already registered? </span>
          <button onClick={() => navigate('login')} className="text-primary-light hover:underline font-semibold">
            Authorize Account
          </button>
        </div>
      </div>
    </div>
  );
}
