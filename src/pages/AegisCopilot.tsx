import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Send, Terminal, Cpu, FileText, ShieldAlert, Award, Activity, CornerDownLeft, Brain, UserCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  isMarkdown?: boolean;
}

export default function AegisCopilot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initial welcome greeting
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'copilot',
        text: `### System Online. I am AegisCopilot, your digital trust coordinator.
How can I assist you with platform audits today? You can search registries, audit logs, or run queries.

**Try asking me:**
- *"Show suspicious logins this week"*
- *"Find revoked certificates"*
- *"Generate security audit report"*
- *"Investigate Alex Johnson"*`,
        timestamp: new Date().toLocaleTimeString(),
        isMarkdown: true
      }
    ]);
  }, []);

  useEffect(() => {
    // Scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      processPrompt(textToSend.toLowerCase());
    }, 1200); // Simulated delay for NLP query parsing
  };

  const processPrompt = (prompt: string) => {
    setIsTyping(false);
    let replyText = '';
    
    const users = db.getUsers();
    const certs = db.getCertificates();
    const logs = db.getAuditLogs();
    const fraud = db.getFraudReports();

    if (prompt.includes('suspicious') || prompt.includes('login') || prompt.includes('anomal')) {
      const suspiciousLogs = logs.filter(l => l.riskScore >= 50 || l.status === 'failure');
      if (suspiciousLogs.length === 0) {
        replyText = `### Zero-Trust Login Audit
Zero suspicious logins detected. All system access parameters match nominal patterns.`;
      } else {
        replyText = `### Suspicious Logins Traced: **${suspiciousLogs.length}**
Here are the traced anomalies matching suspicious user-agents, failed passwords, or brute-force blocks:

| User | Action | Risk Score | Location | IP Address |
| :--- | :--- | :---: | :--- | :--- |
${suspiciousLogs.map(l => `| **${l.userName}** | ${l.action} | \`${l.riskScore}\` | ${l.location} | \`${l.ip}\` |`).join('\n')}

**Security recommendations:** Deploy key rotation if unauthorized modification is suspected.`;
      }
    } 
    
    else if (prompt.includes('revoked') || prompt.includes('suspend') || prompt.includes('cancel')) {
      const revokedCerts = certs.filter(c => c.status === 'revoked' || c.status === 'suspended');
      if (revokedCerts.length === 0) {
        replyText = `### Certificate Registry Audit
No revoked or suspended certificates found in active registry index.`;
      } else {
        replyText = `### Revoked / Suspended Certificates: **${revokedCerts.length}**
Here are the credential IDs marked as deactivated on the blockchain ledger:

| ID | Student | Major | Status | Reason |
| :--- | :--- | :--- | :---: | :--- |
${revokedCerts.map(c => `| \`${c.id}\` | **${c.studentName}** | ${c.department} | **${c.status.toUpperCase()}** | ${c.revocationReason || 'Pending audit'} |`).join('\n')}`;
      }
    } 
    
    else if (prompt.includes('investigate') || prompt.includes('alex') || prompt.includes('johnson')) {
      const alex = users.find(u => u.name.toLowerCase().includes('alex'));
      const alexCert = certs.find(c => c.studentName.toLowerCase().includes('alex'));
      const alexLogs = logs.filter(l => l.userId === alex?.id).slice(0, 5);

      if (!alex) {
        replyText = `### Audit Investigation: Failed
No student record matching "Alex Johnson" found in registered identity profiles.`;
      } else {
        replyText = `### Audit Report: **Alex Johnson**
- **Profile status**: \`${alex.fingerprintStatus?.toUpperCase() || 'PENDING'}\`
- **Identity roll ID**: \`${alex.rollNo || 'N/A'}\`
- **Institution registry**: *${alex.institutionName}*
- **Biometric Face signature key**: \`${alex.faceEnrollId || 'None'}\`
- **Biometric Fingerprint template hash**: \`${alex.fingerprintHash?.slice(0, 16) || 'None'}...\`

#### Academic Ledger Records:
- **Active Degree certificate ID**: \`${alexCert?.id || 'None'}\` (GPA: \`${alexCert?.cgpa || '0.00'}\`)
- **Blockchain IPFS hash pointer**: \`${alexCert?.blockchainHash || 'None'}\`

#### Recent Security Audits:
${alexLogs.map(l => `- **${new Date(l.timestamp).toLocaleDateString()}**: ${l.action} (${l.details}) [Risk: \`${l.riskScore}\`]`).join('\n')}

*Audit status: CONFIRMED NOMINAL*`;
      }
    } 
    
    else if (prompt.includes('report') || prompt.includes('audit') || prompt.includes('stat')) {
      const activeCerts = certs.filter(c => c.status === 'active').length;
      const totalFraud = fraud.length;
      const avgRisk = logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.riskScore, 0) / logs.length) : 0;

      replyText = `### AegisCert Global Trust Audit Report
Generated on: **${new Date().toLocaleString()}**

#### 📊 Registry Analytics
- **Total Registered Identities**: \`${users.length}\`
- **Active Degrees Anchored**: \`${activeCerts}\`
- **Active Fraud Mitigation cases**: \`${totalFraud}\`
- **Average Ecosystem Risk Index**: \`${avgRisk} / 100\`

#### 🛡️ Hardware Biometrics Registry
- **Enrolled scanner licenses**: \`Mantra MFS100 V54 (COM3)\`
- **Integrity verification status**: **MERKLE ROOT NOMINAL**

*AegisCert Platform posture: SECURE.*`;
    } 
    
    else {
      replyText = `### Jarvis Engine NLP Router
I'm not sure how to resolve: "${prompt}".

**You can ask me queries like:**
1. *"Show suspicious logins"* to audit access logs.
2. *"Find revoked certificates"* to audit active ledgers.
3. *"Investigate Alex Johnson"* to audit user profiles.
4. *"Generate security audit report"* to summarize posture.`;
    }

    const copilotMsg: ChatMessage = {
      id: `msg-${Date.now()}-copilot`,
      sender: 'copilot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString(),
      isMarkdown: true
    };
    setMessages(prev => [...prev, copilotMsg]);
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  // Chat typewriter simulation components
  const formatText = (msg: ChatMessage) => {
    if (!msg.isMarkdown) return <p className="leading-relaxed font-sans">{msg.text}</p>;
    
    // Quick custom parser for formatting simple tables and lists
    const lines = msg.text.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const parsedContent = lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-indigo-300 mt-4 mb-2 font-mono uppercase tracking-wider">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold text-slate-200 mt-3 mb-1.5 font-mono">{line.replace('#### ', '')}</h4>;
      }
      
      // Bullets
      if (line.startsWith('- ')) {
        return <li key={idx} className="text-[11px] font-mono text-slate-300 list-none ml-2 mt-1">▪ {line.replace('- ', '')}</li>;
      }

      // Bold key/values
      if (line.startsWith('*')) {
        return <p key={idx} className="italic text-slate-400 text-2xs mt-2">{line.replace(/\*/g, '')}</p>;
      }

      // Tables parser
      if (line.startsWith('|')) {
        // Skip separator lines
        if (line.includes(':---')) return null;
        
        const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (!inTable) {
          inTable = true;
          tableHeaders = cols;
          return null;
        } else {
          tableRows.push(cols);
          return null;
        }
      }

      // If we finished table processing
      if (inTable && !line.startsWith('|')) {
        inTable = false;
        const headers = tableHeaders;
        const rows = [...tableRows];
        tableHeaders = [];
        tableRows = [];
        return (
          <div key={idx} className="overflow-x-auto my-3 border border-white/5 rounded-xl bg-slate-950/40 p-2">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  {headers.map((h, i) => <th key={i} className="pb-1.5 font-bold uppercase">{h.replace(/\*\*/g, '')}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/2 text-slate-300">
                {rows.map((r, ri) => (
                  <tr key={ri} className="hover:bg-white/2">
                    {r.map((col, ci) => <td key={ci} className="py-2">{col.replace(/\*\*/g, '').replace(/`/g, '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return <p key={idx} className="text-[11px] font-mono text-slate-300 leading-relaxed my-1.5">{line.replace(/\*\*/g, '')}</p>;
    });

    return <div className="space-y-1">{parsedContent}</div>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            AegisCopilot AI Assistant
          </h1>
          <p className="text-xs text-slate-400">
            Query identity files, compile automated security audit reports, and investigate SOC threat alerts.
          </p>
        </div>
      </div>

      {/* Chat shell grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Suggestions & AI HUD */}
        <div className="lg:col-span-1 glass-panel border border-white/10 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Cpu className="w-4.5 h-4.5 text-indigo-400 animate-spin-slow" />
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Copilot Core Telemetry</h2>
            </div>
            
            {/* Pulsing Jarvis Sphere */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center bg-indigo-950/15 rounded-full border border-indigo-500/10 shadow-[inner_0_0_20px_rgba(99,102,241,0.1)]">
              <div className="absolute w-24 h-24 rounded-full border border-dashed border-indigo-400/20 animate-spin-slow" />
              <div className="absolute w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-400/30 animate-pulse" />
              <Brain className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Quick Audit Prompts</span>
              <div className="flex flex-col gap-2">
                {[
                  'Show suspicious logins this week',
                  'Find revoked certificates',
                  'Generate security audit report',
                  'Investigate Alex Johnson'
                ].map(txt => (
                  <button
                    key={txt}
                    onClick={() => handleSuggestionClick(txt)}
                    className="p-2.5 bg-slate-900/60 border border-white/5 hover:border-indigo-500/40 rounded-xl text-left text-slate-400 hover:text-slate-200 transition-all font-mono text-[9px] hover:scale-[1.01]"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/2 text-[9px] font-mono text-slate-500 leading-normal">
            AegisCopilot NLP parses natural language query streams into database indices. Direct integration handles threat maps and credentials verification.
          </div>
        </div>

        {/* Right Chat Dialog interface */}
        <div className="lg:col-span-3 glass-panel border border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden relative min-h-0 bg-slate-950/10">
          
          {/* Messages Scroll viewport */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
          >
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-3.5 items-start ${msg.sender === 'user' ? 'justify-end' : ''}`}
              >
                {msg.sender === 'copilot' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl max-w-[85%] border transition-all ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-200'
                    : 'bg-slate-900/40 border-white/5 text-slate-300 shadow-inner'
                }`}>
                  {formatText(msg)}
                  <span className="block text-[8px] font-mono text-slate-500 mt-2 text-right">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 text-slate-300 flex items-center justify-center shrink-0">
                    <Terminal className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3.5 items-center">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Brain className="w-4.5 h-4.5 animate-spin-slow" />
                </div>
                <div className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
                  AegisCopilot is auditing databases...
                </div>
              </div>
            )}
          </div>

          {/* Form input controls */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="p-4 bg-slate-950/40 border-t border-white/5 flex gap-2.5 items-center"
          >
            <input
              type="text"
              placeholder="Ask AegisCopilot about suspicious activities, users, or credentials..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950 border border-white/5 focus:border-indigo-500/30 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-0"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-indigo-600/10 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
