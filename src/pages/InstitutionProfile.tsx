import React, { useState, useEffect } from 'react';
import { db, Institution, User } from '../services/db';
import { Building, Palette, Image as ImageIcon, Award, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InstitutionProfile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  
  // Customization fields
  const [primaryColor, setPrimaryColor] = useState('#6C63FF');
  const [secondaryColor, setSecondaryColor] = useState('#4F46E5');
  const [logoUrl, setLogoUrl] = useState('/logo.jpg');
  const [instName, setInstName] = useState('');
  const [instEmail, setInstEmail] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    const instId = user.institutionId || '';
    const inst = db.getInstitutions().find(i => i.id === instId);
    if (inst) {
      setInstitution(inst);
      setPrimaryColor(inst.primaryColor || '#6C63FF');
      setSecondaryColor(inst.secondaryColor || '#4F46E5');
      setLogoUrl(inst.logoUrl || '/logo.jpg');
      setInstName(inst.name);
      setInstEmail(inst.email);
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    if (!currentUser || !institution) return;

    const instId = currentUser.institutionId || '';
    const insts = db.getInstitutions();
    const updated = insts.map(i => {
      if (i.id === instId) {
        return {
          ...i,
          name: instName,
          email: instEmail,
          primaryColor,
          secondaryColor,
          logoUrl
        };
      }
      return i;
    });

    db.setInstitutions(updated);
    setIsSaved(true);
    confetti({ particleCount: 40, spread: 30 });

    // Log audit
    db.addAuditLog(currentUser.id, currentUser.name, 'institution', 'BRANDING_PROFILE_UPDATED', 'Updated university branding profiles and colors.', 'success');

    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!institution) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Institution Profile & Branding</h1>
        <p className="text-sm text-slate-400">
          Configure university signatures, branding colors, and preview certificates anchored under your namespace.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Settings Panel */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 md:p-8 bg-slate-950/40 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Palette className="w-5 h-5 text-primary-light" />
            Branding Profile Setup
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution Name</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registrar Support Email</label>
                <input
                  type="email"
                  required
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  className="w-full px-4 py-2.5 premium-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Federation ID</label>
                <input
                  type="text"
                  disabled
                  value={institution.regNo}
                  className="w-full px-4 py-2.5 premium-input text-xs bg-slate-900/60 opacity-60 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo URL Link</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branding Colors</label>
              <div className="grid grid-cols-2 gap-6">
                
                {/* Primary Color Picker */}
                <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Primary color</span>
                    <span className="text-xs text-white font-mono uppercase font-bold">{primaryColor}</span>
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Secondary color</span>
                    <span className="text-xs text-white font-mono uppercase font-bold">{secondaryColor}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end items-center gap-4">
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4" />
                Branding Changes Saved!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
            >
              Save Branding Layout
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="w-5 h-5 text-accent" />
              Dynamic Certificate Preview
            </h2>

            {/* Certificate Template Card */}
            <div 
              style={{
                borderColor: `${primaryColor}20`,
                background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08)`,
              }}
              className="border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-2xl"
            >
              {/* Top: Logo and Seal */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <img src={logoUrl} className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow" />
                  <div>
                    <h4 className="text-white text-xs font-bold leading-tight">{instName || 'University Name'}</h4>
                    <span className="text-[8px] text-slate-500 tracking-wider">OFFICIAL ACADEMIC CREDENTIAL</span>
                  </div>
                </div>
                <div 
                  style={{ color: primaryColor }}
                  className="p-1 rounded-full bg-slate-900 border border-white/5 shadow"
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Middle: Student metadata */}
              <div className="my-6 space-y-2">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">This is to certify that</span>
                  <h3 className="text-lg font-extrabold text-white">Alex Johnson</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  has successfully completed all requirements for the degree of <br />
                  <span style={{ color: primaryColor }} className="font-bold">Bachelor of Science in Computer Science</span>
                </p>
              </div>

              {/* Bottom: Checksum and Signature */}
              <div className="pt-4 border-t border-white/5 flex justify-between items-end text-[7px] font-mono text-slate-500">
                <div className="space-y-0.5">
                  <span>LEDGER CHECKSUM HASH</span>
                  <p style={{ color: secondaryColor }} className="text-slate-400 font-bold truncate max-w-[120px]">0x3F2A1D...33D8</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-sans italic text-2xs mb-0.5 border-b border-slate-700 pb-0.5">Registrar signature</div>
                  <span>OFFICIAL DIGITAL SEAL</span>
                </div>
              </div>
            </div>

            <p className="text-3xs text-slate-500 text-center leading-relaxed">
              * The preview above illustrates how degrees dynamically render institution branding colors and digital assets for verifier lookups.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
