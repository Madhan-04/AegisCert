import React, { useState, useEffect, useMemo } from 'react';
import { db, HelpArticle, FAQ, SupportTicket, Feedback } from '../services/db';
import { MessageSquare, Compass, BookOpen, Plus, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AegisAssistManager() {
  // Support ticket datasets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  // Selected ticket for reply
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  // Forms state
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtCategory, setNewArtCategory] = useState('General');
  const [newArtBody, setNewArtBody] = useState('');
  
  const [newFAQQuestion, setNewFAQQuestion] = useState('');
  const [newFAQAnswer, setNewFAQAnswer] = useState('');
  const [newFAQCategory, setNewFAQCategory] = useState('General');

  useEffect(() => {
    setTickets(db.getSupportTickets());
    setFeedbacks(db.getFeedback());
    setArticles(db.getHelpArticles());
    setFaqs(db.getFAQs());
  }, []);

  const handleResolveTicket = (ticketId: string) => {
    const allTkts = db.getSupportTickets();
    const updated = allTkts.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'resolved' as const };
      }
      return t;
    });
    db.setSupportTickets(updated);
    setTickets(updated);
    confetti({ particleCount: 30, spread: 20 });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminReply.trim()) return;

    const allTkts = db.getSupportTickets();
    const updated = allTkts.map(t => {
      if (t.id === selectedTicketId) {
        const replies = t.replies || [];
        replies.push({
          sender: 'Super Admin Registrar',
          message: adminReply,
          timestamp: new Date().toISOString()
        });
        return {
          ...t,
          replies,
          status: 'pending' as const
        };
      }
      return t;
    });

    db.setSupportTickets(updated);
    setTickets(updated);
    setAdminReply('');
    setSelectedTicketId(null);
    confetti({ particleCount: 40, spread: 30 });
  };

  const handleReviewFeedback = (id: string) => {
    const allFb = db.getFeedback();
    const updated = allFb.map(f => {
      if (f.id === id) {
        return { ...f, status: 'reviewed' as const };
      }
      return f;
    });
    db.setFeedback(updated);
    setFeedbacks(updated);
  };

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle.trim() || !newArtBody.trim()) return;

    const allArts = db.getHelpArticles();
    const newArt: HelpArticle = {
      id: `art-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newArtCategory,
      title: newArtTitle,
      body: newArtBody,
      keywords: [newArtCategory.toLowerCase(), 'admin'],
      relatedRoutes: []
    };
    allArts.push(newArt);
    db.setHelpArticles(allArts);
    setArticles(allArts);

    setNewArtTitle('');
    setNewArtBody('');
    confetti({ particleCount: 40, spread: 30 });
  };

  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFAQQuestion.trim() || !newFAQAnswer.trim()) return;

    const allFaqs = db.getFAQs();
    const newFaq: FAQ = {
      id: `faq-${Math.floor(1000 + Math.random() * 9000)}`,
      question: newFAQQuestion,
      answer: newFAQAnswer,
      category: newFAQCategory
    };
    allFaqs.push(newFaq);
    db.setFAQs(allFaqs);
    setFaqs(allFaqs);

    setNewFAQQuestion('');
    setNewFAQAnswer('');
    confetti({ particleCount: 40, spread: 30 });
  };

  const stats = useMemo(() => {
    const totalTkts = tickets.length;
    const openTkts = tickets.filter(t => t.status === 'open').length;
    const resolvedTkts = tickets.filter(t => t.status === 'resolved').length;
    const totalFeedback = feedbacks.length;
    return { totalTkts, openTkts, resolvedTkts, totalFeedback };
  }, [tickets, feedbacks]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">AegisAssist Support Console</h1>
        <p className="text-sm text-slate-400">
          Supervise user support tickets, review feedback suggestions, compile knowledge articles, and monitor assistance analytics.
        </p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Tickets</span>
          <div className="text-3xl font-bold text-white mt-1">{stats.totalTkts}</div>
        </div>
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Open Tickets</span>
          <div className="text-3xl font-bold text-indigo-400 mt-1">{stats.openTkts}</div>
        </div>
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Resolved Tickets</span>
          <div className="text-3xl font-bold text-emerald-400 mt-1">{stats.resolvedTkts}</div>
        </div>
        <div className="premium-card p-6 border border-white/5 bg-slate-950/40">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Logged Feedbacks</span>
          <div className="text-3xl font-bold text-accent mt-1">{stats.totalFeedback}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Support Tickets list */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Support Communication Queue
            </h2>

            <div className="space-y-4">
              {tickets.map(tkt => (
                <div key={tkt.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-bold text-xs">{tkt.subject}</span>
                      <p className="text-[10px] text-slate-500">From: {tkt.userName} ({tkt.userRole}) • {new Date(tkt.timestamp).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        tkt.status === 'open' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : tkt.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tkt.status}
                      </span>
                      {tkt.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveTicket(tkt.id)}
                          className="p-1 hover:bg-slate-800 rounded text-emerald-400"
                          title="Resolve Ticket"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{tkt.message}</p>

                  {/* Replies list */}
                  {tkt.replies && tkt.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-indigo-500 space-y-2 mt-2">
                      {tkt.replies.map((reply, idx) => (
                        <div key={idx} className="text-2xs text-slate-400 leading-normal">
                          <span className="font-bold text-slate-200">{reply.sender}:</span> {reply.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {tkt.status !== 'resolved' && selectedTicketId !== tkt.id && (
                    <button
                      onClick={() => setSelectedTicketId(tkt.id)}
                      className="px-3 py-1.5 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white rounded-xl text-3xs font-bold transition-all active:scale-95"
                    >
                      Reply to Ticket
                    </button>
                  )}

                  {selectedTicketId === tkt.id && (
                    <form onSubmit={handleSendReply} className="pt-2 border-t border-white/5 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Write admin reply..."
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        className="flex-1 px-3 py-2 premium-input text-2xs"
                      />
                      <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-2xs font-bold">
                        Send
                      </button>
                      <button type="button" onClick={() => setSelectedTicketId(null)} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-2xs font-bold">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No support tickets in queue.</p>
              )}
            </div>
          </div>

          {/* Feedback list */}
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Compass className="w-5 h-5 text-accent" />
              Community Suggestions & Features
            </h2>

            <div className="space-y-4">
              {feedbacks.map(fb => (
                <div key={fb.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{fb.title}</span>
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                        {fb.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{fb.description}</p>
                    <span className="text-[9px] text-slate-500 font-mono">Suggested by: {fb.userName}</span>
                  </div>

                  {fb.status === 'open' ? (
                    <button
                      onClick={() => handleReviewFeedback(fb.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-3xs rounded-xl transition-all active:scale-95 shrink-0 shadow"
                    >
                      Review
                    </button>
                  ) : (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 font-mono">
                      REVIEWED
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Article Editor */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Add Documentation */}
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Publish Help Article
            </h2>

            <form onSubmit={handleAddArticle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restoring MFA access keys"
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  className="w-full px-3 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={newArtCategory}
                  onChange={(e) => setNewArtCategory(e.target.value)}
                  className="w-full px-3 py-2 premium-input text-xs bg-slate-900 focus:outline-none"
                >
                  <option value="Getting Started">Getting Started</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Blockchain">Blockchain</option>
                  <option value="Biometrics">Biometrics</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Article Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Input detailed explanation markdown..."
                  value={newArtBody}
                  onChange={(e) => setNewArtBody(e.target.value)}
                  className="w-full px-3 py-2.5 premium-input text-xs"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95">
                Publish Article
              </button>
            </form>
          </div>

          {/* Add FAQ */}
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Plus className="w-5 h-5 text-accent" />
              Publish FAQ Question
            </h2>

            <form onSubmit={handleAddFAQ} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Is my data stored privately?"
                  value={newFAQQuestion}
                  onChange={(e) => setNewFAQQuestion(e.target.value)}
                  className="w-full px-3 py-2.5 premium-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={newFAQCategory}
                  onChange={(e) => setNewFAQCategory(e.target.value)}
                  className="w-full px-3 py-2 premium-input text-xs bg-slate-900 focus:outline-none"
                >
                  <option value="Authentication">Authentication</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Answer</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Input descriptive answer payload..."
                  value={newFAQAnswer}
                  onChange={(e) => setNewFAQAnswer(e.target.value)}
                  className="w-full px-3 py-2.5 premium-input text-xs"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95">
                Publish FAQ
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
