import React, { useState, useMemo, useEffect } from 'react';
import { db, Campus, Department, User } from '../services/db';
import { Building, Plus, Search, MapPin, Grid, Briefcase, GraduationCap, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InstitutionManager() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Modals state
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  
  // Campus Form fields
  const [campusName, setCampusName] = useState('');
  const [campusLoc, setCampusLoc] = useState('');
  const [campusAdmin, setCampusAdmin] = useState('');
  const [campusAdminEmail, setCampusAdminEmail] = useState('');
  
  // Department Form fields
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    const instId = user.institutionId || '';
    setCampuses(db.getCampuses().filter(c => c.institutionId === instId));
    setDepartments(db.getDepartments().filter(d => d.institutionId === instId));
  }, []);

  const handleAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!campusName.trim() || !campusLoc.trim() || !campusAdmin.trim() || !campusAdminEmail.trim()) {
      setError('Please fill in all campus fields.');
      return;
    }

    const instId = currentUser?.institutionId || '';
    const newCmp: Campus = {
      id: `cmp-${Math.random().toString(36).substring(2, 9)}`,
      institutionId: instId,
      name: campusName,
      location: campusLoc,
      adminName: campusAdmin,
      adminEmail: campusAdminEmail
    };

    const allCampuses = db.getCampuses();
    allCampuses.push(newCmp);
    db.setCampuses(allCampuses);
    setCampuses(allCampuses.filter(c => c.institutionId === instId));

    // Audit
    if (currentUser) {
      db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'CAMPUS_REGISTERED', `Added new campus: ${campusName}`, 'success');
    }

    // Recalculate stats in institution profile
    const insts = db.getInstitutions();
    const updatedInsts = insts.map(i => {
      if (i.id === instId) {
        return { ...i, campusCount: (i.campusCount || 0) + 1 };
      }
      return i;
    });
    db.setInstitutions(updatedInsts);

    confetti({ particleCount: 50, spread: 40 });
    
    // Reset Form
    setCampusName('');
    setCampusLoc('');
    setCampusAdmin('');
    setCampusAdminEmail('');
    setShowCampusModal(false);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!deptName.trim() || !deptCode.trim() || !deptHead.trim() || !selectedCampusId) {
      setError('Please fill in all department fields.');
      return;
    }

    const instId = currentUser?.institutionId || '';
    const newDept: Department = {
      id: `dept-${Math.random().toString(36).substring(2, 9)}`,
      institutionId: instId,
      campusId: selectedCampusId,
      name: deptName,
      code: deptCode.toUpperCase(),
      headName: deptHead
    };

    const allDepts = db.getDepartments();
    allDepts.push(newDept);
    db.setDepartments(allDepts);
    setDepartments(allDepts.filter(d => d.institutionId === instId));

    // Audit
    if (currentUser) {
      db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'DEPARTMENT_REGISTERED', `Added new department: ${deptName} (${deptCode})`, 'success');
    }

    // Recalculate stats in institution profile
    const insts = db.getInstitutions();
    const updatedInsts = insts.map(i => {
      if (i.id === instId) {
        return { ...i, departmentCount: (i.departmentCount || 0) + 1 };
      }
      return i;
    });
    db.setInstitutions(updatedInsts);

    confetti({ particleCount: 50, spread: 40 });

    // Reset Form
    setDeptName('');
    setDeptCode('');
    setDeptHead('');
    setSelectedCampusId('');
    setShowDeptModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Campus & Department Management
          </h1>
          <p className="text-sm text-slate-400">
            Structure your institution campuses, assign administrators, and define isolated major departments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Campuses Panel */}
        <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Campuses ({campuses.length})
            </h2>
            <button
              onClick={() => setShowCampusModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-2xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Campus
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {campuses.map(cmp => (
              <div key={cmp.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{cmp.name}</h3>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {cmp.location}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-2xs text-slate-400 pt-2 border-t border-white/5 font-mono">
                  <div>
                    <span className="text-slate-500">Administrator:</span>
                    <p className="text-slate-200 font-sans font-semibold">{cmp.adminName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Dean Contact:</span>
                    <p className="text-slate-200 font-sans">{cmp.adminEmail}</p>
                  </div>
                </div>
              </div>
            ))}
            {campuses.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No campuses registered. Click Add Campus to initialize.</p>
            )}
          </div>
        </div>

        {/* Departments Panel */}
        <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-accent" />
              Departments ({departments.length})
            </h2>
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3 py-1.5 bg-accent hover:bg-accent-light text-white font-semibold text-2xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
              disabled={campuses.length === 0}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {departments.map(dept => {
              const campus = campuses.find(c => c.id === dept.campusId);
              return (
                <div key={dept.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-sm">
                      {dept.name} <span className="text-xs font-light text-slate-400 font-mono">({dept.code})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-slate-800 border border-white/5 px-2 py-0.5 rounded">
                      {campus ? campus.name : 'Unknown Campus'}
                    </span>
                  </div>
                  <div className="text-2xs text-slate-400 pt-2 border-t border-white/5 font-mono">
                    <span className="text-slate-500">Head of Department (HOD):</span>
                    <p className="text-slate-200 font-sans font-semibold text-xs mt-0.5">{dept.headName}</p>
                  </div>
                </div>
              );
            })}
            {departments.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                {campuses.length === 0 ? 'Register a campus first before adding departments.' : 'No departments registered. Click Add Department.'}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Campus Modal */}
      {showCampusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md premium-card border border-white/10 p-6 md:p-8 bg-slate-950 space-y-6 animate-scaleUp">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Campus Location
              </h3>
              <button onClick={() => setShowCampusModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddCampus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campus Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lincoln Laboratories Campus"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location City/State</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lexington, MA"
                  value={campusLoc}
                  onChange={(e) => setCampusLoc(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dean/Administrator Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={campusAdmin}
                  onChange={(e) => setCampusAdmin(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrator Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dean.lincoln@mit.edu"
                  value={campusAdminEmail}
                  onChange={(e) => setCampusAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCampusModal(false)}
                  className="flex-1 py-3 premium-btn-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
                >
                  Create Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md premium-card border border-white/10 p-6 md:p-8 bg-slate-950 space-y-6 animate-scaleUp">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                Register Department
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDept} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Campus</label>
                <select
                  required
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs bg-slate-900 text-slate-100"
                >
                  <option value="">Choose target campus...</option>
                  {campuses.map(cmp => (
                    <option key={cmp.id} value={cmp.id}>{cmp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Code</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="e.g. EE"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Head of Department (HOD) Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Mildred Dresselhaus"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 py-3 premium-btn-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
                >
                  Register Major
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
