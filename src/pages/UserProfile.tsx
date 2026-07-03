import React, { useState, useEffect } from 'react';
import { db, User } from '../services/db';
import { User as UserIcon, Mail, Phone, Landmark, ShieldCheck, Key, Shield, Calendar, Edit3, Save, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');

  const loadProfile = () => {
    const activeUser = db.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
      setName(activeUser.name);
      setEmail(activeUser.email);
      setContact(activeUser.contact || '');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !email.trim()) {
      alert('Name and Email fields are required.');
      return;
    }

    const allDbUsers = db.getUsers();
    const updated = allDbUsers.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          name,
          email,
          contact
        };
      }
      return u;
    });

    db.setUsers(updated);

    // Update active session cache
    const updatedSelf = updated.find(u => u.id === user.id)!;
    db.setCurrentUser(updatedSelf);
    setUser(updatedSelf);

    db.addAuditLog(user.id, name, user.role, 'USER_PROFILE_UPDATED', `User updated own profile data values (Name: ${name}, Email: ${email})`, 'success');
    
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 }
    });

    setIsEditing(false);
    loadProfile();
  };

  if (!user) return null;

  const canEdit = user.role === 'admin' || user.role === 'institution';

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Security Credentials Profile</h1>
          <p className="text-sm text-slate-400">View registered account metadata details and biometric enrollment logs.</p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 hover:border-primary/40 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Card Details */}
        <div className="md:col-span-7 premium-card p-6 border border-white/5 space-y-6 bg-slate-950/40">
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-14 h-14 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-primary-light font-bold text-xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">{user.name}</h3>
              <span className="inline-block text-3xs font-semibold uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                Role: {user.role === 'institution' ? 'University Admin' : user.role}
              </span>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">Full Name / Label</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase">Contact Phone</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                  placeholder="e.g. +1 (555) 019-8822"
                />
              </div>

              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  className="flex-1 py-2.5 premium-btn-secondary text-xs"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-white/2">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Username</span>
                <span className="text-white font-mono">{user.username}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/2">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Email address</span>
                <span className="text-white flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/2">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Contact Phone</span>
                <span className="text-white flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {user.contact || <span className="text-slate-600 italic">Not set</span>}
                </span>
              </div>

              {user.institutionName && (
                <div className="flex justify-between items-center py-2 border-b border-white/2">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Linked Institution</span>
                  <span className="text-white flex items-center gap-1 font-bold">
                    <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                    {user.institutionName}
                  </span>
                </div>
              )}

              {user.role === 'student' && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-white/2">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Roll / Registration Number</span>
                    <span className="text-slate-300 font-mono">{user.rollNo} / {user.regNo}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/2">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Department major</span>
                    <span className="text-slate-300">{user.department}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/2">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-2xs">Batch Year</span>
                    <span className="text-slate-300">{user.batch}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Biometrics security indicators */}
        <div className="md:col-span-5 space-y-6">
          <div className="premium-card p-6 border border-white/5 space-y-4 bg-slate-950/40">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Biometric Access Keys
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-200">6-Digit Security MPIN</span>
                  {user.mpin ? (
                    <span className="text-3xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">CONFIGURED</span>
                  ) : (
                    <span className="text-3xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">NOT SET</span>
                  )}
                </div>
                {user.mpin ? (
                  <div className="space-y-1 text-2xs text-slate-500">
                    <p>Status: <span className="text-emerald-400 font-bold">Securely hashed (PBKDF/BCrypt)</span></p>
                  </div>
                ) : (
                  <p className="text-3xs text-slate-500 font-sans leading-relaxed">Configure a secure 6-digit MPIN on login to verify your identity session without biometric facial scans.</p>
                )}
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-200">Fingerprint match key</span>
                  {user.fingerprintEnrollId ? (
                    <span className="text-3xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">LOCKED</span>
                  ) : (
                    <span className="text-3xs text-slate-500 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded">UNENROLLED</span>
                  )}
                </div>
                {user.fingerprintEnrollId ? (
                  <div className="space-y-1 text-2xs text-slate-500">
                    <p className="truncate">Key ID: <span className="text-primary-light">{user.fingerprintEnrollId}</span></p>
                  </div>
                ) : (
                  <p className="text-3xs text-slate-500 font-sans leading-relaxed">Setup local credential fingerprint mapping profiles for physical degree signing security checks.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
