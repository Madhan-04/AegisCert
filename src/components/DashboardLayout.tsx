import React, { useState, useEffect } from 'react';
import { 
  Shield, Landmark, Users, GraduationCap, FileText, Search, BarChart3, 
  Settings as SettingsIcon, LogOut, Menu, X, Bell, Network, Cpu, Scan, CheckCircle2, AlertTriangle, User as UserIcon, HelpCircle,
  Activity, Ban, ShieldAlert, Fingerprint, Wallet, ShieldCheck, Terminal,
  Building, Globe, Database, Smartphone, Key, Webhook, WifiOff
} from 'lucide-react';
import { db, User } from '../services/db';
import CommandNexus from './CommandNexus';

interface DashboardLayoutProps {
  currentUser: User;
  currentRoute: string;
  navigate: (route: string) => void;
  onLogout: () => void;
  onRoleSwitch: (roleUser: User) => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ 
  currentUser, 
  currentRoute, 
  navigate, 
  onLogout,
  onRoleSwitch,
  children 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [latency, setLatency] = useState(400);
  const [nexusOpen, setNexusOpen] = useState(false);

  // Keyboard shortcut listener for Command Nexus (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setNexusOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync settings states on mount
  const [bioBypass, setBioBypass] = useState(false);

  useEffect(() => {
    const settings = db.getSettings();
    setLatency(settings.networkLatency);
    setTampered(settings.tamperedCerts.includes('CERT-2025-4819'));
    setBioBypass(!!settings.biometricSimulationMode);
  }, []);

  const handleTamperToggle = (checked: boolean) => {
    setTampered(checked);
    const settings = db.getSettings();
    if (checked) {
      // Add Alex's cert to tampered list
      settings.tamperedCerts = ['CERT-2025-4819'];
      db.addAuditLog('dev-console', 'System Debugger', 'admin', 'LEDGER_TAMPERED', 'Simulated manual tampering of Certificate CERT-2025-4819', 'failure');
    } else {
      settings.tamperedCerts = [];
      db.addAuditLog('dev-console', 'System Debugger', 'admin', 'LEDGER_RESTORED', 'Simulated manual repair of Certificate CERT-2025-4819', 'success');
    }
    db.setSettings(settings);
  };

  const handleLatencyChange = (val: number) => {
    setLatency(val);
    const settings = db.getSettings();
    settings.networkLatency = val;
    db.setSettings(settings);
  };

  const handleBioBypassToggle = (checked: boolean) => {
    setBioBypass(checked);
    const settings = db.getSettings();
    settings.biometricSimulationMode = checked;
    db.setSettings(settings);
    db.addAuditLog('dev-console', 'System Debugger', 'admin', 'BIOMETRIC_BYPASS_TOGGLED', `Biometric hardware bypass simulation set to ${checked}`, 'success');
  };

  const getNavigationLinks = () => {
    switch (currentUser.role) {
      case 'admin':
        return [
          { name: 'Admin Overview', route: 'admin-dashboard', icon: <Shield className="w-4 h-4" /> },
          { name: 'Academic Federation', route: 'academic-federation', icon: <Building className="w-4 h-4" /> },
          { name: 'Enterprise Gateway', route: 'api-gateway', icon: <Key className="w-4 h-4 text-emerald-400" /> },
          { name: 'Document Intelligence', route: 'document-intelligence', icon: <Cpu className="w-4 h-4 text-cyan-400" /> },
          { name: 'Executive Center', route: 'executive-dashboard', icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
          { name: 'Backup Center', route: 'backup-center', icon: <Database className="w-4 h-4" /> },
          { name: 'Mission Control', route: 'mission-control', icon: <Cpu className="w-4 h-4 animate-pulse" /> },
          { name: 'AegisCopilot AI', route: 'copilot', icon: <Terminal className="w-4 h-4 text-indigo-400" /> },
          { name: 'Digital Trust Graph', route: 'trust-graph', icon: <Network className="w-4 h-4 text-purple-400" /> },
          { name: 'Security Suite', route: 'security-controls', icon: <ShieldAlert className="w-4 h-4" /> },
          { name: 'SOC Dashboard', route: 'soc-dashboard', icon: <Activity className="w-4 h-4" /> },
          { name: 'AI Fraud Dashboard', route: 'fraud-dashboard', icon: <ShieldAlert className="w-4 h-4" /> },
          { name: 'Support Manager', route: 'aegisassist-manager', icon: <HelpCircle className="w-4 h-4" /> },
          { name: 'System Settings', route: 'settings', icon: <SettingsIcon className="w-4 h-4" /> },
        ];
      case 'institution':
        return [
          { name: 'University Panel', route: 'institution-dashboard', icon: <Landmark className="w-4 h-4" /> },
          { name: 'Institution Profile', route: 'institution-profile', icon: <Building className="w-4 h-4" /> },
          { name: 'Analytics', route: 'institution-analytics', icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
          { name: 'Department Manager', route: 'institution-manager', icon: <Building className="w-4 h-4 text-indigo-400" /> },
          { name: 'Issue Certificate', route: 'issuance', icon: <FileText className="w-4 h-4" /> },
          { name: 'Revocation Center', route: 'revocation-center', icon: <Ban className="w-4 h-4" /> },
          { name: 'Backup', route: 'backup-center', icon: <Database className="w-4 h-4" /> },
          { name: 'Settings', route: 'settings', icon: <SettingsIcon className="w-4 h-4" /> },
        ];
      case 'student':
        return [
          { name: 'My Cabinet', route: 'student-dashboard', icon: <GraduationCap className="w-4 h-4" /> },
          { name: 'Credential Wallet', route: 'wallet', icon: <Wallet className="w-4 h-4" /> },
          { name: 'Profile', route: 'profile', icon: <UserIcon className="w-4 h-4" /> },
          { name: 'Notifications', route: 'notification-center', icon: <Bell className="w-4 h-4" /> },
          { name: 'Offline Mode', route: 'offline-manager', icon: <WifiOff className="w-4 h-4 text-amber-400" /> },
          { name: 'Settings', route: 'settings', icon: <SettingsIcon className="w-4 h-4" /> },
        ];
      case 'verifier':
      default:
        return [
          { name: 'Verifier Cabinet', route: 'verifier-dashboard', icon: <Users className="w-4 h-4" /> },
          { name: 'Offline Verification', route: 'offline-verification', icon: <WifiOff className="w-4 h-4" /> },
          { name: 'Document Intelligence', route: 'document-intelligence', icon: <Cpu className="w-4 h-4 text-cyan-400" /> },
          { name: 'Certificate Verification', route: 'verification', icon: <Search className="w-4 h-4" /> },
          { name: 'Settings', route: 'settings', icon: <SettingsIcon className="w-4 h-4" /> },
        ];
    }
  };

  // Find users for quick-switching
  const allUsers = db.getUsers();
  const superAdminUser = allUsers.find(u => u.role === 'admin')!;
  const mitAdminUser = allUsers.find(u => u.role === 'institution' && u.institutionId === 'inst-mit')!;
  const studentUser = allUsers.find(u => u.role === 'student')!;
  const verifierUser = allUsers.find(u => u.role === 'verifier')!;

  const navLinks = getNavigationLinks();

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex relative overflow-hidden cyber-grid">
      {/* Mesh Background Orbs */}
      <div className="glow-orb w-[600px] h-[600px] bg-primary/10 top-[-20%] left-[-10%]" />
      <div className="glow-orb w-[600px] h-[600px] bg-accent/5 bottom-[-10%] right-[-10%]" />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:h-screen shrink-0 shadow-2xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('landing')}>
            <img src="/logo.jpg" className="w-8 h-8 rounded-xl object-cover shadow-md shadow-primary/20 border border-white/10" />
            <span className="text-lg font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-light">
              AEGIS<span className="text-accent font-light">CERT</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Gateways</div>
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => {
                navigate(link.route);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                currentRoute === link.route 
                  ? 'bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25 text-white shadow-[0_4px_20px_-4px_rgba(108,99,255,0.25)] font-bold' 
                  : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {link.icon}
              {link.name}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40 space-y-3.5">
          <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{currentUser.role === 'institution' ? 'University' : currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-rose-500/10 hover:scale-[1.01]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Revoke Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        {db.getSettings().killSwitchActive && (
          <div className="w-full bg-rose-600/90 text-white border-b border-rose-500 text-center py-2.5 px-4 text-xs font-mono font-extrabold uppercase tracking-widest animate-pulse flex items-center justify-center gap-2 z-40 shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
            ⚠️ EMERGENCY SYSTEM FREEZE IN EFFECT - OPERATION PORTALS LOCKED ⚠️
          </div>
        )}
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-white/5 bg-slate-950/30 backdrop-blur-md px-6 flex justify-between items-center sticky top-0 z-30 shrink-0">
          {/* Mobile Menu trigger */}
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>

          {/* Search trigger or context title */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-slate-500 uppercase tracking-widest font-bold">
              Active Security Layer:
            </span>
            <span className="px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary-light font-bold">
              {currentUser.role}
            </span>
            {currentUser.institutionName && (
              <span className="truncate max-w-[200px] border-l border-white/10 pl-3">
                {currentUser.institutionName}
              </span>
            )}
            
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setNexusOpen(true)}
              className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-white/10 rounded-xl hover:border-primary/50 text-slate-400 hover:text-white transition-all text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search / Commands</span>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/15 rounded text-[10px] font-mono tracking-tighter">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Simulated Node Sync Status */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/60 border border-white/5 rounded-full text-2xs text-slate-400">
              <Network className="w-3.5 h-3.5 text-accent-light animate-pulse" />
              <span>Ping: {latency}ms</span>
            </div>

            <button onClick={() => navigate('audit-logs')} className="relative p-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="View Logs">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>

            <button onClick={() => navigate('profile')} className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center hover:border-primary transition-colors">
              <UserIcon className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating Development Console Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setDevOpen(!devOpen)}
          className="relative p-3 bg-gradient-to-tr from-primary to-accent hover:from-primary-light hover:to-accent-light text-white rounded-full shadow-[0_8px_32px_rgba(108,99,255,0.3)] hover:scale-105 active:scale-95 transition-transform animate-glow"
        >
          <Cpu className="w-6 h-6 animate-spin-slow" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        </button>

        {/* Dev Console Modal */}
        {devOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Cpu className="w-4 h-4 text-primary" />
                Simulation Control Panel
              </span>
              <button onClick={() => setDevOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Switch */}
            <div className="space-y-2">
              <span className="block text-2xs font-bold text-slate-500 uppercase tracking-widest">QUICK ROLE ACCESS SWITCH</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onRoleSwitch(superAdminUser); setDevOpen(false); }}
                  className={`p-2 rounded-lg border text-left font-semibold ${currentUser.role === 'admin' ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  Super Admin
                </button>
                <button
                  onClick={() => { onRoleSwitch(mitAdminUser); setDevOpen(false); }}
                  className={`p-2 rounded-lg border text-left font-semibold ${currentUser.role === 'institution' ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  MIT Univ Admin
                </button>
                <button
                  onClick={() => { onRoleSwitch(studentUser); setDevOpen(false); }}
                  className={`p-2 rounded-lg border text-left font-semibold ${currentUser.role === 'student' ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  Student (Alex)
                </button>
                <button
                  onClick={() => { onRoleSwitch(verifierUser); setDevOpen(false); }}
                  className={`p-2 rounded-lg border text-left font-semibold ${currentUser.role === 'verifier' ? 'border-primary bg-primary/10 text-white' : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  Google Verifier
                </button>
              </div>
            </div>

            {/* AI Fraud Simulator (Tamper Hash) */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  AI FRAUD SIMULATOR
                </span>
                <input
                  type="checkbox"
                  checked={tampered}
                  onChange={(e) => handleTamperToggle(e.target.checked)}
                  className="rounded border-white/10 text-rose-600 focus:ring-rose-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
              </div>
              <p className="text-2xs text-slate-500 leading-relaxed">
                Check this box to manually alter student Alex Johnson's local certificate hash. When verified, the portal will immediately trigger an AI tampering alert!
              </p>
            </div>

            {/* Biometric Simulation Mode */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  BIOMETRIC HARDWARE BYPASS
                </span>
                <input
                  type="checkbox"
                  checked={bioBypass}
                  onChange={(e) => handleBioBypassToggle(e.target.checked)}
                  className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
              </div>
              <p className="text-2xs text-slate-500 leading-relaxed">
                If checked, the portal bypasses physical webcam checking and physical Mantra MFS100 fingerprint USB connections, allowing simulated mockup inputs.
              </p>
            </div>

            {/* Simulated Node Latency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-2xs font-bold text-slate-500">
                <span>SIMULATED NETWORK LATENCY</span>
                <span className="text-accent-light">{latency}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={latency}
                onChange={(e) => handleLatencyChange(Number(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        )}
      </div>

      <CommandNexus 
        isOpen={nexusOpen} 
        onClose={() => setNexusOpen(false)} 
        navigate={navigate} 
      />
    </div>
  );
}
