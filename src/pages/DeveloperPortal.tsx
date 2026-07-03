import React, { useState } from 'react';
import { Terminal, Copy, Check, Code, BookOpen, Key, Link } from 'lucide-react';

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<'js' | 'py' | 'curl'>('curl');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const codeSnippets = {
    curl: `curl -X POST https://api.aegiscert.gov/v1/verification/verify-hash \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "certHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }'`,
    js: `const verifyCredential = async (certHash) => {
  const response = await fetch('https://api.aegiscert.gov/v1/verification/verify-hash', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ certHash })
  });
  
  const result = await response.json();
  console.log('Verification Status:', result.status); // "active", "suspended", etc.
};`,
    py: `import requests

url = "https://api.aegiscert.gov/v1/verification/verify-hash"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "certHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print("Verification Status:", result.get("status"))`
  };

  const handleCopy = (lang: 'js' | 'py' | 'curl') => {
    navigator.clipboard.writeText(codeSnippets[lang]);
    setCopiedText(lang);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Developer Integration Portal</h1>
        <p className="text-sm text-slate-400">
          Connect your campus databases, verify certificate ledger status, and integrate verifier workflows via REST API endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* API reference documentation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <BookOpen className="w-5 h-5 text-primary-light" />
              REST API Endpoint Reference
            </h2>

            <div className="space-y-6">
              {/* Endpoint 1 */}
              <div className="space-y-3 p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded uppercase">POST</span>
                  <code className="text-white text-xs font-mono font-bold">/v1/verification/verify-hash</code>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Query the blockchain ledger directly to audit a digital credential's status and fetch signer institution signatures.
                </p>
                <div className="text-[10px] font-mono space-y-1">
                  <span className="text-slate-500 font-bold block">Request Params:</span>
                  <div className="pl-3 border-l border-slate-700 text-slate-300">
                    <p><code className="text-primary-light font-bold">certHash</code> (string, required): The document's SHA-256 hash.</p>
                  </div>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="space-y-3 p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold rounded uppercase">GET</span>
                  <code className="text-white text-xs font-mono font-bold">/v1/students/:rollNo</code>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fetch isolated student registration profiles matching the roll identifier under your university namespace.
                </p>
                <div className="text-[10px] font-mono space-y-1">
                  <span className="text-slate-500 font-bold block">URL Path Variables:</span>
                  <div className="pl-3 border-l border-slate-700 text-slate-300">
                    <p><code className="text-indigo-400 font-bold">rollNo</code> (string, required): Student academic roll ID.</p>
                  </div>
                </div>
              </div>

              {/* Endpoint 3 */}
              <div className="space-y-3 p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold rounded uppercase">GET</span>
                  <code className="text-white text-xs font-mono font-bold">/v1/institutions/:id</code>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lookup approved academic partners registration details and verification keys.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Code Playground */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-accent" />
                Integration Code Blocks
              </h2>
              
              <div className="flex gap-1.5 p-1 bg-slate-900 rounded-lg border border-white/5 text-[9px] font-bold text-slate-400">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-2 py-1 rounded ${activeTab === 'curl' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab('js')}
                  className={`px-2 py-1 rounded ${activeTab === 'js' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
                >
                  Fetch
                </button>
                <button
                  onClick={() => setActiveTab('py')}
                  className={`px-2 py-1 rounded ${activeTab === 'py' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Terminal Block */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 font-mono text-2xs leading-relaxed relative text-slate-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3 text-slate-500">
                <span className="flex items-center gap-1.5 font-sans text-3xs font-bold uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Terminal Shell
                </span>
                <button
                  onClick={() => handleCopy(activeTab)}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white transition-all"
                  title="Copy Code"
                >
                  {copiedText === activeTab ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              
              <pre className="overflow-x-auto whitespace-pre font-mono p-1 select-all text-indigo-200">
                {codeSnippets[activeTab]}
              </pre>
            </div>

            <p className="text-3xs text-slate-500 leading-relaxed">
              * Replace <code className="text-slate-400 font-bold">YOUR_API_KEY</code> with active credentials generated in the API Gateway. Keep secrets stored in encrypted environmental files.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
