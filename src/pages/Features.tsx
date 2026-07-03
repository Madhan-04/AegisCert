import React from 'react';
import { Shield, Smartphone, Eye, Users, FileText, BarChart3, Lock, CheckCircle2 } from 'lucide-react';
import AntigravityBackground from '../components/AntigravityBackground';

interface FeaturesProps {
  navigate: (route: string) => void;
}

export default function Features({ navigate }: FeaturesProps) {
  const features = [
    {
      icon: <Lock className="w-6 h-6 text-primary-light" />,
      title: "Blockchain Immobility",
      description: "Hash signatures are anchored onto the Ethereum blockchain, making certificate data permanent and immune to deletion."
    },
    {
      icon: <Eye className="w-6 h-6 text-accent-light" />,
      title: "Biometric Liveness Detection",
      description: "Uses device camera for facial scanning overlay. Integrates biometric hashes for ultimate proof-of-identity verification."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-400" />,
      title: "QR Code Dynamic Scanning",
      description: "Generates custom QR codes linking to verification pages, supporting in-browser camera scanning and verification."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      title: "Multi-Role Dashboards",
      description: "Role-specific UI views for Admins, Universities, Students, and Verifiers with appropriate access levels."
    },
    {
      icon: <FileText className="w-6 h-6 text-pink-400" />,
      title: "Instant PDF Diploma Issuance",
      description: "Generate beautifully formatted digital PDF certificates containing blockchain hashes, signatures, and scan codes."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      title: "AI-Powered Fraud Intelligence",
      description: "Logs all access attempts, flags anomalies, and detects tampered certificates by comparing storage hashes against blockchain ledgers."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-darkBg text-slate-100 cyber-grid">
      <AntigravityBackground />
      {/* Background Glow Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-accent/15 top-[-10%] left-[-10%]" />
      <div className="glow-orb w-[600px] h-[600px] bg-primary/10 bottom-[-10%] right-[-10%]" />

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
          <button onClick={() => navigate('about')} className="hover:text-white transition-colors">About</button>
          <button onClick={() => navigate('features')} className="text-white transition-colors">Features</button>
          <button onClick={() => navigate('verification')} className="hover:text-white transition-colors">Verification Portal</button>
        </nav>

        <div className="flex gap-4">
          <button onClick={() => navigate('login')} className="px-5 py-2 text-sm font-semibold glass-panel rounded-xl">
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto py-16 px-6 space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold">System Features</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Explore the core features driving security, trust, and usability across our decentralized verification network.
          </p>
        </div>

        {/* Features grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Roles Details */}
        <section className="glass-panel p-8 rounded-3xl border border-white/10 space-y-8">
          <h2 className="text-2xl font-bold text-center">User Access Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Feature / Action</th>
                  <th className="py-3 px-4 text-center">Super Admin</th>
                  <th className="py-3 px-4 text-center">University Admin</th>
                  <th className="py-3 px-4 text-center">Student</th>
                  <th className="py-3 px-4 text-center">Verifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Approve Universities</td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Issue Certificates</td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Revoke Certificates</td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Register Face / Fingerprints</td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center">-</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white">Query Verification Ledger</td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                  <td className="py-4 px-4 text-center"><CheckCircle2 className="w-4.5 h-4.5 text-primary-light inline" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate('register')}
            className="px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Create Your Account
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
