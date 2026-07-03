import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, ShieldAlert, Key, Cpu, CheckCircle2, User, Award, Activity, Network, X, CornerDownLeft } from 'lucide-react';
import { db } from '../services/db';

interface CommandNexusProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (route: string) => void;
}

export default function CommandNexus({ isOpen, onClose, navigate }: CommandNexusProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Static commands list
  const commands = [
    { id: 'nav-mc', name: 'Go to Mission Control Center', type: 'nav', shortcut: '/nav mission', route: 'mission-control', icon: <Cpu className="w-4 h-4 text-indigo-400" /> },
    { id: 'nav-cop', name: 'Go to AegisCopilot AI Assistant', type: 'nav', shortcut: '/nav copilot', route: 'copilot', icon: <Terminal className="w-4 h-4 text-cyan-400" /> },
    { id: 'nav-tg', name: 'Go to Digital Trust Graph', type: 'nav', shortcut: '/nav graph', route: 'trust-graph', icon: <Network className="w-4 h-4 text-purple-400" /> },
    { id: 'nav-soc', name: 'Go to SOC Operations Dashboard', type: 'nav', shortcut: '/nav soc', route: 'soc-dashboard', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { id: 'nav-sec', name: 'Go to Security Hardening Suite', type: 'nav', shortcut: '/nav security', route: 'security-controls', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
    
    // Cryptographic and security operations
    { id: 'cmd-kill', name: 'Toggle Emergency System Freeze', type: 'cmd', shortcut: '/killswitch', action: 'killswitch', icon: <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> },
    { id: 'cmd-rotate', name: 'Rotate Database Encryption Keys', type: 'cmd', shortcut: '/rotate-keys', action: 'rotate', icon: <Key className="w-4 h-4 text-indigo-400" /> },
    { id: 'cmd-verify', name: 'Verify Cryptographic DB Integrity', type: 'cmd', shortcut: '/verify-integrity', action: 'integrity', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'cmd-lockout', name: 'Reset All Brute Force Lockouts', type: 'cmd', shortcut: '/reset-lockouts', action: 'lockout', icon: <User className="w-4 h-4 text-amber-400" /> }
  ];

  // Dynamic search results: Users and Certificates
  const allUsers = db.getUsers();
  const allCerts = db.getCertificates();

  const matchedUsers = query.trim()
    ? allUsers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedCerts = query.trim()
    ? allCerts.filter(c => c.id.toLowerCase().includes(query.toLowerCase()) || c.studentName.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Filter commands by query
  const filteredCommands = query
    ? commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.shortcut.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Combine items
  const items = [
    ...filteredCommands,
    ...matchedUsers.map(u => ({
      id: `user-${u.id}`,
      name: `User Profile: ${u.name} (${u.role.toUpperCase()})`,
      type: 'user',
      shortcut: `@${u.username}`,
      route: u.role === 'student' ? 'profile' : 'admin-dashboard',
      icon: <User className="w-4 h-4 text-indigo-400" />
    })),
    ...matchedCerts.map(c => ({
      id: `cert-${c.id}`,
      name: `Certificate ID: ${c.id} - ${c.studentName}`,
      type: 'cert',
      shortcut: `#${c.id}`,
      route: `verification`,
      hashParam: `id=${c.id}`,
      icon: <Award className="w-4 h-4 text-emerald-400" />
    }))
  ];

  const handleAction = (item: any) => {
    onClose();
    if (item.type === 'nav' || item.type === 'user') {
      navigate(item.route);
    } else if (item.type === 'cert') {
      // Go to verification with query param hash
      window.location.hash = `${item.route}?${item.hashParam}`;
    } else if (item.type === 'cmd') {
      executeCommand(item.action);
    }
  };

  const executeCommand = (action: string) => {
    if (action === 'killswitch') {
      const settings = db.getSettings();
      const nextState = !settings.killSwitchActive;
      settings.killSwitchActive = nextState;
      db.setSettings(settings);
      
      const admin = db.getCurrentUser();
      if (nextState) {
        db.setActiveSessions(db.getActiveSessions().filter(s => s.userId === admin?.id));
        db.addAuditLog(admin?.id || 'admin', admin?.name || 'Admin', 'admin', 'EMERGENCY_KILL_SWITCH_ACTIVATED', 'Emergency system freeze activated via Command Nexus.', 'success', 100);
        db.addSocEvent('critical', 'EMERGENCY_FREEZE_ACTIVE', 'Nexus trigger: Global freeze active', '127.0.0.1');
        alert('EMERGENCY FREEZE ENGAGED: Operations blocked.');
      } else {
        db.addAuditLog(admin?.id || 'admin', admin?.name || 'Admin', 'admin', 'EMERGENCY_KILL_SWITCH_DEACTIVATED', 'Emergency system freeze deactivated via Command Nexus.', 'success', 20);
        db.addSocEvent('medium', 'EMERGENCY_FREEZE_RESTORED', 'Nexus trigger: Global operations restored', '127.0.0.1');
        alert('Emergency freeze disengaged. Portals restored.');
      }
      window.location.reload();
    } else if (action === 'rotate') {
      const res = db.rotateDatabaseKeys();
      if (res.success) {
        alert(`Cryptographic key rotated successfully! Re-encrypted ${res.recordsEncrypted} records under key: ${res.newKey.slice(0, 15)}...`);
      } else {
        alert('Key rotation failed.');
      }
    } else if (action === 'integrity') {
      const check = db.verifyDatabaseIntegrity();
      if (check.valid) {
        alert(`Database Integrity verified! Expected and calculated Merkle roots match: ${check.calculatedHash}`);
      } else {
        alert(`WARNING: Database Integrity check failed! Calculated mismatch root: ${check.calculatedHash}`);
      }
    } else if (action === 'lockout') {
      const users = db.getUsers();
      const updated = users.map(u => ({ ...u, failedLoginAttempts: 0, lockedUntil: undefined }));
      db.setUsers(updated);
      
      const admin = db.getCurrentUser();
      db.addAuditLog(admin?.id || 'admin', admin?.name || 'Admin', 'admin', 'LOCKOUTS_RESET', 'Manually cleared all system brute force user lockouts via Command Nexus.', 'success', 10);
      alert('All brute force user account lockouts have been reset successfully!');
    }
  };

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleAction(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-slate-950/30">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes, profiles, or type command..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none"
          />
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-500 border border-white/5 font-mono select-none font-bold uppercase shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2.5 space-y-0.5">
          {items.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-2xs">
              No matching commands, nodes, or files found.
            </div>
          ) : (
            items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleAction(item)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                  selectedIndex === idx
                    ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border border-indigo-500/30 text-white shadow-inner'
                    : 'border border-transparent hover:bg-white/2 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 font-mono text-2xs font-semibold">
                  {item.icon}
                  <span className={selectedIndex === idx ? 'text-slate-200' : 'text-slate-400'}>
                    {item.name}
                  </span>
                </div>
                
                {selectedIndex === idx ? (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400 font-bold">
                    <span>EXECUTE</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600 font-bold bg-slate-950/30 px-2 py-0.5 rounded border border-white/2">
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Console info footer */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 text-[9px] font-mono text-slate-500 flex justify-between">
          <span>Search index status: Synchronized</span>
          <span>Use Arrow keys to select, Enter to run</span>
        </div>
      </div>
    </div>
  );
}
