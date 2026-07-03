import React, { useState } from 'react';
import { db } from '../services/db';
import { HelpCircle, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function Support() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Smart Contract Verification');
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState('');

  const faqs = [
    {
      q: "How does the blockchain verify certificates?",
      a: "When a university issues a degree, it hashes the metadata (name, roll, major, GPA) using SHA-256 and signs it. This signature is written permanently into an Ethereum smart contract transaction. Verification computes the checksum of the diploma copy and matches it against these locked records."
    },
    {
      q: "Where is my biometric data stored?",
      a: "AegisCert prioritizes privacy. Your face/fingerprint images are never uploaded. Instead, we use browser optical sensors to calculate localized math vector hashes (bioprint keys) that are stored as cryptographic templates. Matching happens client-side."
    },
    {
      q: "What should I do if my verification is flagged as 'Tampered'?",
      a: "A 'Tampered' exception means the computed hash of the provided credential does not match the blockchain registry. Check if someone modified text values inside the database or diploma file copy. Report anomalies to your university registrar."
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const id = `TIC-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(id);

    const user = db.getCurrentUser();
    db.addAuditLog(
      user?.id || 'anonymous',
      user?.name || 'Anonymous User',
      user?.role || 'verifier',
      'SUPPORT_TICKET_SUBMITTED',
      `Submitted ticket ${id} under category "${category}". Subject: ${subject}`,
      'success'
    );

    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Technical Support Center</h1>
        <p className="text-sm text-slate-400">Search system FAQs, learn security protocols, or submit a support ticket to platform engineers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left FAQS */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-light" />
              Frequently Asked Questions
            </h3>

            <div className="space-y-4 text-xs leading-relaxed">
              {faqs.map((faq, idx) => (
                <div key={idx} className="space-y-1.5 p-3.5 bg-slate-950/20 rounded-xl border border-white/2">
                  <h4 className="font-bold text-slate-200 flex items-start gap-2">
                    <span className="text-indigo-400 font-mono">Q.</span>
                    {faq.q}
                  </h4>
                  <p className="text-slate-400 pl-4">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Ticketing Form */}
        <div className="md:col-span-5">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-light" />
              Submit Incident Ticket
            </h3>

            {ticketId ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-4 animate-fadeIn text-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-slate-300">
                  <h4 className="font-bold text-white">Ticket Submitted Successfully</h4>
                  <p>Reference: <span className="font-mono text-emerald-400 font-bold">{ticketId}</span></p>
                </div>
                <p className="text-slate-500 text-2xs leading-relaxed">A support ticket has been compiled. Platform engineers will analyze system logs associated with your account hash.</p>
                <button
                  onClick={() => setTicketId('')}
                  className="w-full py-2 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl text-2xs font-semibold"
                >
                  Create New Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 glass-input bg-slate-900 focus:outline-none"
                  >
                    <option>Smart Contract Verification</option>
                    <option>Facial Biometrics Enrollment</option>
                    <option>Certificate Signature Mismatch</option>
                    <option>Node Connectivity Failures</option>
                    <option>Other Technical Question</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of the issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input font-normal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 uppercase">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about transaction hashes, error message logs, or step reproduction..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input font-normal resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <Send className="w-4 h-4" />
                  Submit Ticket Payload
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
