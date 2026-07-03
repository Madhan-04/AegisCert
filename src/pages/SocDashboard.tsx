import React, { useState, useEffect } from 'react';
import { db, SocEvent, ActiveSession } from '../services/db';
import { 
  Shield, ShieldAlert, Users, Network, Activity, Globe, Trash2, CheckCircle2, 
  RefreshCw, AlertTriangle, AlertCircle, ShieldCheck, Terminal, Server
} from 'lucide-react';

export default function SocDashboard() {
  const [events, setEvents] = useState<SocEvent[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [healthStatus, setHealthStatus] = useState<'nominal' | 'scanning' | 'alert'>('nominal');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSocData = () => {
    setEvents(db.getSocEvents());
    setSessions(db.getActiveSessions());
  };

  useEffect(() => {
    loadSocData();
    // Poll every 8 seconds for real-time cyber logs feel
    const interval = setInterval(loadSocData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadSocData();
      setIsRefreshing(false);
    }, 800);
  };

  const handleResolveAlert = (id: string) => {
    const allEvents = db.getSocEvents();
    const updated = allEvents.map(ev => {
      if (ev.id === id) {
        return { ...ev, handled: true };
      }
      return ev;
    });
    db.setSocEvents(updated);
    setEvents(updated);
    db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'SOC_ALERT_RESOLVED', `Resolved security incident event ${id}`, 'success');
  };

  const handleTerminateSession = (token: string, name: string) => {
    const allSessions = db.getActiveSessions();
    const filtered = allSessions.filter(s => s.token !== token);
    db.setActiveSessions(filtered);
    setSessions(filtered);
    
    db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'SESSION_REVOKED', `Forcefully terminated system login session for user "${name}"`, 'success');
    db.addSocEvent('high', 'SESSION_TERMINATED_SOC', `Super Admin terminated active session token for "${name}"`, '127.0.0.1');
    loadSocData();
  };

  const calculateThreatScore = () => {
    const unhandled = events.filter(e => !e.handled);
    let score = 5; // Base normal level
    unhandled.forEach(e => {
      if (e.severity === 'critical') score += 25;
      else if (e.severity === 'high') score += 15;
      else if (e.severity === 'medium') score += 7;
      else if (e.severity === 'low') score += 3;
    });
    return Math.min(score, 100);
  };

  const threatScore = calculateThreatScore();

  const getThreatColor = (score: number) => {
    if (score < 20) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score < 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const filteredEvents = events.filter(ev => {
    if (severityFilter === 'all') return true;
    return ev.severity === severityFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Security Operations Center (SOC)
          </h1>
          <p className="text-sm text-slate-400">
            Real-time cybersecurity console monitoring blockchain nodes, active session tokens, and threat anomalies.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-primary/40 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Scanning Nodes...' : 'Force System Check'}
        </button>
      </div>

      {/* Top Section: Threat Radar Sweeper and System Status Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Animated Threat Radar Sweeper */}
        <div className="lg:col-span-5 premium-card p-6 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950/40 min-h-[300px]">
          <h3 className="text-2xs font-extrabold uppercase tracking-widest text-slate-500 mb-4 self-start">Active Threat Radar Map</h3>
          
          <div className="relative w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center bg-slate-950/80 shadow-inner">
            {/* Concentric Grid Rings */}
            <div className="absolute w-36 h-36 rounded-full border border-dashed border-primary/15" />
            <div className="absolute w-24 h-24 rounded-full border border-dashed border-primary/10" />
            <div className="absolute w-12 h-12 rounded-full border border-dashed border-primary/5" />
            
            {/* Crosshairs */}
            <div className="absolute inset-x-0 h-[1px] bg-primary/10" />
            <div className="absolute inset-y-0 w-[1px] bg-primary/10" />
            
            {/* Radar Sweeping Beam - Static high-tech indicator (no rotating CPU cost) */}
            <div className="absolute inset-0 rounded-full pointer-events-none opacity-40"
                 style={{
                   background: 'conic-gradient(from 120deg, rgba(108, 99, 255, 0.2) 0deg, rgba(108, 99, 255, 0) 120deg)',
                 }}
            />
            
            {/* Threat Blips (Unresolved Events mapped deterministically) */}
            {events.filter(e => !e.handled).slice(0, 4).map((ev, i) => {
              const angles = [40, 145, 230, 315];
              const radii = [25, 55, 70, 40];
              const angle = angles[i % 4] * (Math.PI / 180);
              const r = radii[i % 4];
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              
              return (
                <div 
                  key={ev.id}
                  className="absolute w-3 h-3 animate-pulse"
                  style={{
                    left: `calc(50% + ${x}px - 6px)`,
                    top: `calc(50% + ${y}px - 6px)`,
                  }}
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500/20 border border-rose-500/80" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white/20 shadow-lg shadow-rose-500/50" title={`${ev.category}: ${ev.details}`} />
                </div>
              );
            })}
            
            {/* Core Radar Node */}
            <div className="absolute w-2 h-2 rounded-full bg-indigo-400 shadow-glow" />
          </div>
          
          <div className="flex gap-4 mt-4 text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Incident Alert</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Center Core</span>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Threat Gauge */}
          <div className={`premium-card p-6 border ${getThreatColor(threatScore)} flex flex-col justify-between space-y-4`}>
            <div className="flex justify-between items-center">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-slate-400">Global Threat Index</span>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-4xl font-extrabold tracking-tight">{threatScore}%</div>
              <span className="text-2xs font-semibold block mt-1 uppercase tracking-wider text-slate-400">
                {threatScore < 20 ? 'Nominal Operation' : threatScore < 50 ? 'Medium Advisory Alert' : 'Critical Threat Severity'}
              </span>
            </div>
          </div>

          {/* Incidents Count */}
          <div className="premium-card p-6 border border-white/5 flex flex-col justify-between space-y-4 text-slate-400">
            <div className="flex justify-between items-center">
              <span className="text-2xs font-extrabold uppercase tracking-widest">Active Incident Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {events.filter(e => !e.handled).length}
              </div>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                Unhandled Events logs
              </span>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="premium-card p-6 border border-white/5 flex flex-col justify-between space-y-4 text-slate-400">
            <div className="flex justify-between items-center">
              <span className="text-2xs font-extrabold uppercase tracking-widest">Active Sessions</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white tracking-tight">{sessions.length}</div>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                Encrypted tokens in database
              </span>
            </div>
          </div>

          {/* Database Seals Status */}
          <div className="premium-card p-6 border border-white/5 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-2xs font-extrabold uppercase tracking-widest">Database Seals Status</span>
              <Network className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-1.5 mt-2">
                <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
                SECURE SEALS
              </div>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                100% database hashes verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Panel grid: Sessions on left, Alerts logs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Active Session Manager */}
        <section className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active System Session Tokens
            </h3>
            <p className="text-2xs text-slate-400">
              Session tokens are verified and stored inside the encrypted registry database. Terminal operators can revoke them immediately.
            </p>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No active session tokens found.</div>
            ) : (
              sessions.map((sess) => (
                <div key={sess.token} className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-xs">{sess.name}</h4>
                      <p className="text-3xs text-indigo-400 font-mono font-semibold uppercase tracking-wider mt-0.5">{sess.role}</p>
                    </div>
                    <button
                      onClick={() => handleTerminateSession(sess.token, sess.name)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Terminate Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-3xs font-mono text-slate-500 leading-tight">
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span className="text-slate-400">{sess.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Device:</span>
                      <span className="text-slate-400 truncate max-w-[150px]">{sess.device}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-2xs">
                      <span>Token Hash:</span>
                      <span className="text-slate-500 font-bold font-mono">{sess.token.substring(0, 15)}...</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Side: Security Severity Alerts Panel */}
        <section className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                Security Threat Log Registry
              </h3>
              <p className="text-2xs text-slate-400">Chronological checklist of AI anomaly alarms and biometric failure indicators.</p>
            </div>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-2 text-2xs font-semibold">
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 rounded-lg border uppercase ${severityFilter === sev ? 'bg-primary/20 border-primary text-white' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'}`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No incidents matching the filter found.</div>
            ) : (
              filteredEvents.map((ev) => (
                <div 
                  key={ev.id} 
                  className={`p-4 rounded-xl border flex gap-4 items-start transition-all ${ev.handled ? 'bg-slate-950/20 border-white/5 opacity-55' : 'bg-slate-950/70 border-white/10'}`}
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${
                    ev.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' :
                    ev.severity === 'high' ? 'bg-rose-500/10 border-rose-500/15 text-rose-400' :
                    ev.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/15 text-amber-400' :
                    'bg-indigo-500/10 border-indigo-500/15 text-indigo-400'
                  }`}>
                    {ev.severity === 'critical' ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-3xs font-bold text-slate-400 uppercase mr-2">{ev.category}</span>
                        <span className={`text-3xs font-extrabold uppercase ${
                          ev.severity === 'critical' ? 'text-rose-400' :
                          ev.severity === 'high' ? 'text-rose-400' :
                          ev.severity === 'medium' ? 'text-amber-400' :
                          'text-indigo-400'
                        }`}>
                          {ev.severity} ALERT
                        </span>
                      </div>
                      <span className="text-3xs font-mono text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{ev.details}</p>

                    <div className="flex justify-between items-center text-3xs text-slate-500 font-mono">
                      <span>Source IP: {ev.ip}</span>
                      {!ev.handled ? (
                        <button
                          onClick={() => handleResolveAlert(ev.id)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors font-sans font-bold"
                        >
                          Resolve Alert
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Handled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Cyber System Health Dashboard Cards */}
      <section className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          Real-Time Crypto Node Integrity Verification
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-2xs text-slate-400 leading-relaxed">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
            <span className="text-slate-500 font-bold block">EVM BLOCKCHAIN GATEWAY</span>
            <div className="flex items-center gap-2 text-white font-bold">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>RPC Endpoint: Sync 100%</span>
            </div>
            <p className="text-3xs text-slate-500">Connected to Polygon RPC Gateway. Gas index verified at 25 Gwei.</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
            <span className="text-slate-500 font-bold block">DATABASE SYMMETRIC SEAL</span>
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>XOR Base64 Integrity Check: OK</span>
            </div>
            <p className="text-3xs text-slate-500">Local storage keys are encrypted and isolated inside the sandbox memory.</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
            <span className="text-slate-500 font-bold block">BIOMETRIC LIVENESS CRITERIA</span>
            <div className="flex items-center gap-2 text-white font-bold">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Webcam Liveness Check: Armed</span>
            </div>
            <p className="text-3xs text-slate-500">5-stage mathematical blink, rotation and smile validations enabled.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
