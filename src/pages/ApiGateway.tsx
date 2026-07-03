import React, { useState, useEffect } from 'react';
import { db, ApiKey, User } from '../services/db';
import { Key, Webhook, Cpu, Plus, Trash2, Globe, Send, ShieldAlert, Activity, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ApiGateway() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<{ id: string; url: string; event: string; active: boolean }[]>([
    { id: 'wh-1', url: 'https://api.verifyme.com/v1/webhooks/aegis', event: 'CERTIFICATE_ISSUED', active: true }
  ]);

  // Form Fields
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvent, setNewWebhookEvent] = useState('CERTIFICATE_ISSUED');
  
  // OAuth Sandbox
  const [clientId, setClientId] = useState('client_aegis_oauth_882910');
  const [clientSecret, setClientSecret] = useState('secret_0x8f3d1c9e4b2b9f0a1c3de3b0c44298fc1c');
  const [oauthToken, setOauthToken] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const [error, setError] = useState('');
  const [pingSuccess, setPingSuccess] = useState<string | null>(null);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    const instId = user.institutionId || '';
    setApiKeys(db.getApiKeys().filter(k => k.institutionId === instId));
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const instId = currentUser?.institutionId || '';
    const newKey: ApiKey = {
      id: `key-${Math.random().toString(36).substring(2, 9)}`,
      institutionId: instId,
      key: `ae_${Math.random().toString(36).substring(2, 6)}_mit_${Math.floor(10000000 + Math.random() * 90000000).toString(16)}`,
      name: newKeyName,
      created: new Date().toISOString(),
      status: 'active',
      rateLimit: 1000,
      usageCount: 0
    };

    const allKeys = db.getApiKeys();
    allKeys.unshift(newKey);
    db.setApiKeys(allKeys);
    setApiKeys(allKeys.filter(k => k.institutionId === instId));

    // Audit
    if (currentUser) {
      db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'API_KEY_GENERATED', `Generated API credential key: ${newKeyName}`, 'success');
    }

    confetti({ particleCount: 40, spread: 30 });
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    const instId = currentUser?.institutionId || '';
    const allKeys = db.getApiKeys();
    const updated = allKeys.map(k => {
      if (k.id === id) {
        if (currentUser) {
          db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'API_KEY_REVOKED', `Revoked API integration key: ${k.name}`, 'success');
        }
        return { ...k, status: 'revoked' as const };
      }
      return k;
    });
    db.setApiKeys(updated);
    setApiKeys(updated.filter(k => k.institutionId === instId));
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    const newWh = {
      id: `wh-${Math.random().toString(36).substring(2, 9)}`,
      url: newWebhookUrl,
      event: newWebhookEvent,
      active: true
    };

    setWebhooks([...webhooks, newWh]);
    setNewWebhookUrl('');

    if (currentUser) {
      db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'WEBHOOK_REGISTERED', `Registered webhook listener: ${newWebhookUrl}`, 'success');
    }
  };

  const handlePingWebhook = (url: string) => {
    setPingSuccess(null);
    db.addSocEvent('low', 'WEBHOOK_PING', `Webhook diagnostic dispatch to URL: ${url}`, '127.0.0.1');
    setTimeout(() => {
      setPingSuccess(url);
      setTimeout(() => setPingSuccess(null), 3000);
    }, 1000);
  };

  const handleSimulateOAuth = () => {
    setOauthLoading(true);
    setOauthToken('');
    setTimeout(() => {
      setOauthLoading(false);
      setOauthToken(`access_token_jwt_${Math.random().toString(16).substring(2, 14)}...expire_in_3600`);
      confetti({ particleCount: 30, spread: 20 });
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Enterprise API Gateway & Settings</h1>
        <p className="text-sm text-slate-400">
          Provision developer authentication keys, setup webhooks endpoints, and verify OAuth client environments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Keys & Webhooks */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Key management */}
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Key className="w-5 h-5 text-primary-light" />
              API Key Management
            </h2>

            <form onSubmit={handleGenerateKey} className="flex gap-4">
              <input
                type="text"
                required
                placeholder="Key Description (e.g. Workday Payroll Sync)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-4 py-2.5 premium-input text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Generate Key
              </button>
            </form>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {apiKeys.map(k => (
                <div key={k.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white text-xs font-bold truncate">{k.name}</h4>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                        k.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {k.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate select-all">{k.key}</p>
                    <span className="text-[9px] text-slate-500 block">Created: {new Date(k.created).toLocaleDateString()}</span>
                  </div>
                  
                  {k.status === 'active' && (
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all active:scale-90 shrink-0"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Webhooks */}
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Webhook className="w-5 h-5 text-accent" />
              Event Webhook Registers
            </h2>

            <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <input
                type="url"
                required
                placeholder="https://your-server.com/webhooks"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="md:col-span-8 px-4 py-2.5 premium-input text-xs"
              />
              <select
                value={newWebhookEvent}
                onChange={(e) => setNewWebhookEvent(e.target.value)}
                className="md:col-span-4 px-3 py-2.5 premium-input text-xs bg-slate-900 focus:outline-none"
              >
                <option value="CERTIFICATE_ISSUED">Cert Issued</option>
                <option value="CERTIFICATE_REVOKED">Cert Revoked</option>
                <option value="TAMPER_DETECTED">Tamper Alert</option>
              </select>
              <button
                type="submit"
                className="md:col-span-12 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Register Webhook Endpoint
              </button>
            </form>

            <div className="space-y-4">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div className="space-y-1 truncate">
                    <span className="text-[8px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded uppercase">
                      {wh.event}
                    </span>
                    <p className="text-xs text-white truncate font-mono mt-1">{wh.url}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pingSuccess === wh.url && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                        <Check className="w-3.5 h-3.5" />
                        200 OK
                      </span>
                    )}
                    <button
                      onClick={() => handlePingWebhook(wh.url)}
                      className="px-3 py-1.5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-2xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Send className="w-3 h-3 text-indigo-400" />
                      Test Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* OAuth Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Globe className="w-5 h-5 text-emerald-400" />
              OAuth 2.0 Auth Server Sandbox
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Client ID</span>
                <input
                  type="text"
                  readOnly
                  value={clientId}
                  className="w-full px-3 py-2 premium-input text-2xs bg-slate-900 cursor-text select-all"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Client Secret</span>
                <input
                  type="text"
                  readOnly
                  value={clientSecret}
                  className="w-full px-3 py-2 premium-input text-2xs bg-slate-900 cursor-text select-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateOAuth}
                  className="w-full py-2.5 bg-slate-900 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white rounded-xl text-2xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  disabled={oauthLoading}
                >
                  <Activity className={`w-3.5 h-3.5 text-emerald-400 ${oauthLoading ? 'animate-spin' : ''}`} />
                  {oauthLoading ? 'Requesting JWT Exchange...' : 'Simulate OAuth Token Exchange'}
                </button>
              </div>

              {oauthToken && (
                <div className="p-3 bg-slate-900/80 border border-emerald-500/20 rounded-xl space-y-1.5 animate-fadeIn">
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">Access Token Payload</span>
                  <p className="text-[10px] text-slate-200 select-all break-all leading-relaxed">{oauthToken}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl flex gap-3 text-slate-400 text-3xs leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                Authorization endpoints simulate industry-standard OAuth handshakes, generating cryptographic JSON Web Tokens (JWT) for third-party registrar integrations.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
