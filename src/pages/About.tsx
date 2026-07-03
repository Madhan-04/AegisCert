import React from 'react';
import { Shield, BookOpen, Layers, GitBranch, Key, Cpu, Award } from 'lucide-react';
import AntigravityBackground from '../components/AntigravityBackground';

interface AboutProps {
  navigate: (route: string) => void;
}

export default function About({ navigate }: AboutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-darkBg text-slate-100 cyber-grid">
      <AntigravityBackground />
      {/* Background Glow Orbs */}
      <div className="glow-orb w-[600px] h-[600px] bg-secondary/10 top-[-20%] right-[-10%]" />
      <div className="glow-orb w-[500px] h-[500px] bg-primary/10 bottom-[-10%] left-[-10%]" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('landing')}>
          <img src="/logo.jpg" className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-primary/20 border border-white/10" />
          <span className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-primary-light font-sans">
            AEGIS<span className="text-accent font-light">CERT</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button onClick={() => navigate('landing')} className="hover:text-white transition-colors">Home</button>
          <button onClick={() => navigate('about')} className="text-white transition-colors">About</button>
          <button onClick={() => navigate('features')} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => navigate('verification')} className="hover:text-white transition-colors">Verification Portal</button>
        </nav>

        <div className="flex gap-4">
          <button onClick={() => navigate('login')} className="px-5 py-2 text-sm font-semibold glass-panel rounded-xl">
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto py-16 px-6 space-y-16">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold">System Architecture</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A comprehensive overview of AegisCert's cryptographic, consensus, and biometric pipeline.
          </p>
        </div>

        {/* Security Core Diagram */}
        <section className="glass-panel p-8 rounded-3xl border border-white/10 space-y-8">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary-light" />
            Verification Flow Diagram
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mx-auto text-primary-light font-bold">1</div>
              <h4 className="font-bold text-white">Document Hashing</h4>
              <p className="text-xs text-slate-400">
                A hash function (SHA-256) compresses academic records into a unique 64-character hash representing the document's contents.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mx-auto text-accent-light font-bold">2</div>
              <h4 className="font-bold text-white">Smart Contract Anchoring</h4>
              <p className="text-xs text-slate-400">
                The institution signs the record and writes the hash to the Ethereum ledger. It is locked into block transactions forever.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center mx-auto text-secondary-light font-bold">3</div>
              <h4 className="font-bold text-white">Public Verification</h4>
              <p className="text-xs text-slate-400">
                Verifiers query the blockchain database. The system dynamically hashes the provided certificate and checks for a valid transaction log matches.
              </p>
            </div>
          </div>
        </section>

        {/* Deep Dive Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">Decentralized Blockchain Nodes</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Academic credentials are not stored in central servers vulnerable to breach. Instantly generated cryptographic proofs are pinned to Ethereum (simulated as an EVM ledger), creating a permanently auditable history of student credentials that is immune to server shutdowns or data tampering.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">Biometric Identity Protection</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standard digital diplomas can easily be stolen or shared. By integrating client-side face capture and fingerprint checks, we verify that the individual requesting validation matches the registered credentials. Biometric data is stored only as localized cryptographic templates.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">Cryptographic Digital Signatures</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every certificate contains a signature computed using the university's private key. This establishes non-repudiation. Even if a bad actor manages to insert a record, verification will fail immediately if the signature does not match the public key of an approved institution.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">Audit Trails & Revocations</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Should a university need to invalidate a degree due to plagiarism, fraud, or error, the blockchain handles it through smart contract state changes. A certificate is marked as 'REVOKED', updating the global registry status while preserving the audit history of the original block.
            </p>
          </div>
        </section>

        {/* Call to action */}
        <div className="text-center">
          <button
            onClick={() => navigate('features')}
            className="px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Explore System Features
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} AegisCert Network. All Rights Reserved. Built with Ethereum Smart Contracts.
      </footer>
    </div>
  );
}
