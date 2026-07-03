import React, { useState } from 'react';
import { Network, Info, Landmark, Award, User, Users, Cpu, ShieldCheck, CornerDownLeft } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'admin' | 'university' | 'student' | 'verifier' | 'credential' | 'blockchain';
  x: number; // SVG center coordinate
  y: number;
  icon: React.ReactNode;
  metadata: Record<string, string>;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export default function TrustGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const nodes: GraphNode[] = [
    {
      id: 'admin',
      label: 'Mr. MADHAN (Super Admin)',
      type: 'admin',
      x: 250,
      y: 80,
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      metadata: {
        role: 'Root security administrator node',
        license: 'AegisCert Core Node v5.0',
        status: 'Operational',
        ip: '127.0.0.1 (COM3)',
        biometricVerification: 'Enabled (Face + Mantra Fingerprint)'
      }
    },
    {
      id: 'mit',
      label: 'MIT Registrar (Issuer)',
      type: 'university',
      x: 120,
      y: 180,
      icon: <Landmark className="w-5 h-5 text-indigo-400" />,
      metadata: {
        institution: 'Massachusetts Institute of Technology',
        idCode: 'inst-mit',
        status: 'Authorized Registrar',
        issuedDegrees: '1 active degree anchored',
        consensusKey: '0x4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a'
      }
    },
    {
      id: 'cert',
      label: 'CERT-2026-0001 (Degree)',
      type: 'credential',
      x: 250,
      y: 280,
      icon: <Award className="w-5 h-5 text-emerald-400" />,
      metadata: {
        credentialId: 'CERT-2026-0001',
        degree: 'Bachelor of Science (Computer Science)',
        cgpa: '3.91 / 4.00',
        blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        signature: 'RSA-4096 cryptographically signed',
        status: 'Verified (Active)'
      }
    },
    {
      id: 'student',
      label: 'Alex Johnson (Holder)',
      type: 'student',
      x: 120,
      y: 380,
      icon: <User className="w-5 h-5 text-indigo-400" />,
      metadata: {
        name: 'Alex Johnson',
        rollNo: 'MIT-2024-082',
        status: 'Biometrics Anchored',
        verificationPassport: 'AegisPassport v4.0',
        walletStatus: 'Connected (4 verifiable credentials)'
      }
    },
    {
      id: 'verifier',
      label: 'Google HR (Auditor)',
      type: 'verifier',
      x: 380,
      y: 180,
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      metadata: {
        auditorName: 'Google HR Global Verification',
        verifierId: 'usr-verifier',
        lastVerification: 'Successfully audited e3b0c44... on 2026-06-21',
        queryStatus: 'Nominal'
      }
    },
    {
      id: 'block',
      label: 'Consensus Block #1084',
      type: 'blockchain',
      x: 380,
      y: 380,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      metadata: {
        ledger: 'Polygon PoS mainnet consensus',
        blockNumber: '#1084221',
        gasFee: '0.0028 Gwei (Simulated)',
        proofOfWork: 'SHA-256 state header verified',
        anchoredLogs: 'Successfully validated and sealed'
      }
    }
  ];

  const links: GraphLink[] = [
    { source: 'admin', target: 'mit', type: 'authorizes' },
    { source: 'mit', target: 'cert', type: 'issues' },
    { source: 'cert', target: 'student', type: 'belongs_to' },
    { source: 'verifier', target: 'cert', type: 'audits' },
    { source: 'cert', target: 'block', type: 'anchors_on' }
  ];

  const getNodeColor = (type: string, isSelected: boolean) => {
    if (isSelected) return 'stroke-indigo-500 fill-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.5)]';
    switch (type) {
      case 'admin':
      case 'university':
      case 'student':
        return 'stroke-indigo-500/50 fill-slate-900/90';
      case 'verifier':
        return 'stroke-cyan-500/50 fill-slate-900/90';
      case 'credential':
      case 'blockchain':
        return 'stroke-emerald-500/50 fill-slate-900/90';
      default:
        return 'stroke-white/10 fill-slate-900/90';
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
          <Network className="w-6 h-6 text-indigo-400" />
          Digital Trust Relationship Graph
        </h1>
        <p className="text-xs text-slate-400">
          Visualize real-time cryptographic links connecting administrators, university registrars, verifiable degree certificates, students, and blockchain blocks.
        </p>
      </div>

      {/* Grid Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: SVG Graph Canvas */}
        <div className="lg:col-span-2 glass-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center bg-slate-950/20 min-h-[480px]">
          
          <svg className="w-full h-[450px]" viewBox="0 0 500 480">
            {/* Draw Links/Lines */}
            {links.map((link, idx) => {
              const srcNode = nodes.find(n => n.id === link.source)!;
              const tgtNode = nodes.find(n => n.id === link.target)!;
              const isHighlighted = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    className={`stroke-2 transition-all duration-300 ${
                      isHighlighted 
                        ? 'stroke-indigo-500 opacity-90 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                        : 'stroke-white/5 opacity-40'
                    }`}
                  />
                  {/* Arrow marker indicator */}
                  <circle
                    cx={(srcNode.x + tgtNode.x) / 2}
                    cy={(srcNode.y + tgtNode.y) / 2}
                    r="2.5"
                    className={isHighlighted ? 'fill-indigo-400 animate-ping' : 'fill-slate-600'}
                  />
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              
              return (
                <g 
                  key={node.id} 
                  className="cursor-pointer transition-all duration-300 group"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Glowing halo behind selected node */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="28"
                      className="fill-indigo-500/10 stroke-indigo-500/20 stroke-1 animate-pulse"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="22"
                    className={`stroke-[1.5] transition-all duration-300 group-hover:stroke-indigo-400 ${getNodeColor(node.type, isSelected)}`}
                  />

                  {/* Icon wrapper inside circle */}
                  <foreignObject
                    x={node.x - 10}
                    y={node.y - 10}
                    width="20"
                    height="20"
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {node.icon}
                    </div>
                  </foreignObject>

                  {/* Node label */}
                  <text
                    x={node.x}
                    y={node.y + 32}
                    textAnchor="middle"
                    className={`text-[8.5px] font-mono font-bold tracking-wide transition-colors ${
                      isSelected ? 'fill-indigo-300' : 'fill-slate-400 group-hover:fill-slate-200'
                    }`}
                  >
                    {node.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Graph metadata overlay */}
          <div className="absolute bottom-4 left-6 flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Click any entity node to inspect its cryptographic properties and links.</span>
          </div>
        </div>

        {/* Right Column: Node Details Inspector */}
        <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-6">
          {selectedNode ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/5 pb-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/10 text-indigo-400">
                    {selectedNode.icon}
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                      {selectedNode.type} Node Info
                    </span>
                    <h3 className="text-sm font-extrabold text-white leading-tight">{selectedNode.label}</h3>
                  </div>
                </div>
              </div>

              {/* Node Claims Metadata List */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-widest">
                  Metadata Claims
                </h4>
                
                <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-3 font-mono text-2xs">
                  {Object.entries(selectedNode.metadata).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-0.5 border-b border-white/2 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-slate-300 font-bold break-all">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Node connections details */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-widest">
                  Cryptographic Connections
                </h4>

                <div className="space-y-2">
                  {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).map((link, idx) => {
                    const otherNodeId = link.source === selectedNode.id ? link.target : link.source;
                    const otherNode = nodes.find(n => n.id === otherNodeId)!;
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => setSelectedNode(otherNode)}
                        className="p-2.5 bg-slate-900/60 border border-white/5 hover:border-indigo-500/20 rounded-xl flex items-center justify-between text-2xs font-mono cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <span className="text-slate-400 capitalize">{link.type.replace('_', ' ')}:</span>
                        <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                          {otherNode.label.split(' ')[0]}
                          <CornerDownLeft className="w-3 h-3 shrink-0" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400">
                <Network className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400">Trust Graph Inspector</h4>
                <p className="text-2xs text-slate-500 max-w-[200px] mx-auto mt-1 leading-relaxed">
                  Select any node in the trust relationship canvas to inspect cryptographic credentials, public keys, and ledger connections.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
