import React, { useState, useMemo } from 'react';
import { db, Institution } from '../services/db';
import { Shield, Users, Award, Building, Plus, Search, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AcademicFederation() {
  const [institutions, setInstitutions] = useState<Institution[]>(() => db.getInstitutions());
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstReg, setNewInstReg] = useState('');
  const [newInstEmail, setNewInstEmail] = useState('');
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const total = institutions.length;
    const approved = institutions.filter(i => i.status === 'approved').length;
    const pending = institutions.filter(i => i.status === 'pending').length;
    return { total, approved, pending };
  }, [institutions]);

  const filteredInsts = useMemo(() => {
    return institutions.filter(i => 
      i.name.toLowerCase().includes(query.toLowerCase()) || 
      i.regNo.toLowerCase().includes(query.toLowerCase())
    );
  }, [institutions, query]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newInstName.trim() || !newInstReg.trim() || !newInstEmail.trim()) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (institutions.some(i => i.regNo === newInstReg)) {
      setError('An institution with this registration ID already exists.');
      return;
    }

    const newInst: Institution = {
      id: `inst-${Math.random().toString(36).substring(2, 9)}`,
      name: newInstName,
      regNo: newInstReg,
      email: newInstEmail,
      status: 'approved', // Auto-approved by Super Admin
      createdAt: new Date().toISOString(),
      logoUrl: '/logo.jpg',
      primaryColor: '#6C63FF',
      secondaryColor: '#4F46E5',
      campusCount: 1,
      departmentCount: 1
    };

    const updated = [newInst, ...institutions];
    setInstitutions(updated);
    db.setInstitutions(updated);

    // Seed default user for this institution
    const allUsers = db.getUsers();
    const newUser = {
      id: `usr-${newInst.id}`,
      username: newInstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8),
      password: hashPassword('password123'), // seed password
      role: 'institution' as const,
      name: `${newInstName} Registrar`,
      email: newInstEmail,
      institutionId: newInst.id,
      institutionName: newInstName,
      mpin: hashPassword('123456')
    };
    allUsers.push(newUser);
    db.setUsers(allUsers);

    // Audit logs
    const admin = db.getCurrentUser();
    if (admin) {
      db.addAuditLog(admin.id, admin.name, 'admin', 'FEDERATION_INSTITUTION_REGISTERED', `Registered new federation partner university: ${newInstName}`, 'success');
    }

    // Celebrate
    confetti({ particleCount: 80, spread: 60 });

    // Reset Form
    setNewInstName('');
    setNewInstReg('');
    setNewInstEmail('');
    setShowAddModal(false);
  };

  // bcrypt password hash mock inside component as helper
  function hashPassword(pwd: string): string {
    let hash = pwd;
    const salt = 'aegiscert_bcrypt_salt_v4_';
    for (let round = 0; round < 4096; round++) {
      let hashVal = 0;
      const combined = hash + salt + round;
      for (let i = 0; i < combined.length; i++) {
        hashVal = (hashVal << 5) - hashVal + combined.charCodeAt(i);
        hashVal = hashVal & hashVal;
      }
      hash = Math.abs(hashVal).toString(16).padStart(8, '0') + hash.slice(0, 8);
    }
    return 'bcrypt$12$' + hash.slice(0, 32);
  }

  const handleToggleStatus = (id: string) => {
    const updated = institutions.map(i => {
      if (i.id === id) {
        const nextStatus = i.status === 'approved' ? 'pending' : 'approved';
        // Audit
        const admin = db.getCurrentUser();
        if (admin) {
          db.addAuditLog(admin.id, admin.name, 'admin', 'FEDERATION_STATUS_TOGGLED', `Changed ${i.name} status to ${nextStatus.toUpperCase()}`, 'success');
        }
        return { ...i, status: nextStatus as any };
      }
      return i;
    });
    setInstitutions(updated);
    db.setInstitutions(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Academic Federation Management Center (AFMC)
          </h1>
          <p className="text-sm text-slate-400">
            Superintendent platform dashboard managing registered universities, blockchain namespaces, and multi-tenant nodes.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Register University
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Partners</span>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none">Registered active university profiles</div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Nodes</span>
              <div className="text-3xl font-bold text-emerald-400">{stats.approved}</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none">Institutions approved for certificate issuance</div>
        </div>

        <div className="premium-card p-6 border border-white/5 bg-slate-950/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Awaiting Review</span>
              <div className="text-3xl font-bold text-amber-500">{stats.pending}</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-none">Federation applications pending approval</div>
        </div>
      </div>

      {/* Main List */}
      <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search partner list by name or registration ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Institution Name</th>
                <th className="pb-3">Register Code</th>
                <th className="pb-3">Support Mail</th>
                <th className="pb-3">Campuses</th>
                <th className="pb-3">Node Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInsts.map(inst => (
                <tr key={inst.id} className="hover:bg-white/2 font-medium text-slate-300">
                  <td className="py-3 pl-2 text-white font-bold">{inst.name}</td>
                  <td className="py-3 font-mono">{inst.regNo}</td>
                  <td className="py-3">{inst.email}</td>
                  <td className="py-3">{inst.campusCount || 1} Campuses</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      inst.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'approved' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {inst.status === 'approved' ? 'Active Approved' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => handleToggleStatus(inst.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-2xs border transition-all active:scale-95 ${
                        inst.status === 'approved'
                          ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                          : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {inst.status === 'approved' ? 'Suspend Node' : 'Activate Node'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInsts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No academic federation partners found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md premium-card border border-white/10 p-6 md:p-8 bg-slate-950 space-y-6 animate-scaleUp">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Register Federation University
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">University Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. US-STAN-1049"
                  value={newInstReg}
                  onChange={(e) => setNewInstReg(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dean Registrar Support Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. registrar@stanford.edu"
                  value={newInstEmail}
                  onChange={(e) => setNewInstEmail(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 premium-btn-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
                >
                  Authorize Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
