import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, HelpArticle, FAQ, SupportTicket, Feedback, TroubleshootingGuide } from '../services/db';
import { 
  HelpCircle, Search, BookOpen, Bot, Compass, AlertOctagon, MessageSquare, 
  Send, X, Check, ChevronRight, Play, ArrowRight, CornerDownRight, ShieldAlert 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WalkthroughStep {
  selector: string;
  title: string;
  content: string;
}

const TOUR_CONFIGS: Record<string, WalkthroughStep[]> = {
  issuance: [
    { selector: 'input[placeholder="e.g. Alex Johnson"]', title: 'Student Identity', content: 'Enter the full legal name of the candidate.' },
    { selector: 'input[type="date"]', title: 'Date of Birth', content: 'Select student birth certificate details.' },
    { selector: 'input[placeholder="e.g. MIT-2024-082"]', title: 'Roll Identifier', content: 'Input the unique academic roll registration number.' },
    { selector: 'button[type="submit"]', title: 'Ledger Commit', content: 'Press this to calculate certificate hash and anchor it on the blockchain.' }
  ],
  explorer: [
    { selector: 'input[placeholder*="Search by certificate"]', title: 'Search Ledger', content: 'Paste computed SHA-256 certificate hashes here.' },
    { selector: '.premium-card', title: 'Ledger Blocks', content: 'Monitor real-time gas calculations and node signatures.' }
  ]
};

export default function AegisAssistPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'kb' | 'ai' | 'tour' | 'trb' | 'faq' | 'contact'>('home');
  
  // Data State
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [troubleGuides, setTroubleGuides] = useState<TroubleshootingGuide[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);

  // Support Ticket Form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('General');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Suggestions Form
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'suggestion'>('suggestion');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // AI Assistant Chat state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: 'Hello! I am AegisAssist AI. How can I help you navigate the academic credential gateway today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Tour State
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [tourStyle, setTourStyle] = useState<React.CSSProperties>({});
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  
  const currentUser = db.getCurrentUser();

  useEffect(() => {
    setArticles(db.getHelpArticles());
    setFaqs(db.getFAQs());
    setTroubleGuides(db.getTroubleshootingGuides());

    // Shortcut listener (F1 or Ctrl + /)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Sync Search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = articles.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.body.toLowerCase().includes(q) || 
      a.keywords.some(k => k.toLowerCase().includes(q))
    );
    setSearchResults(filtered);
  }, [searchQuery, articles]);

  // Context-Aware help detection
  const detectedContext = useMemo(() => {
    const hash = currentHash || '';
    if (hash.includes('login') || hash.includes('register')) {
      return articles.filter(a => a.id === 'art-login');
    }
    if (hash.includes('issuance')) {
      return articles.filter(a => a.id === 'art-issuance');
    }
    if (hash.includes('fingerprint') || hash.includes('profile')) {
      return articles.filter(a => a.id === 'art-biometrics');
    }
    if (hash.includes('explorer') || hash.includes('verification')) {
      return articles.filter(a => a.id === 'art-blockchain');
    }
    return articles.slice(0, 2);
  }, [articles, currentHash]);

  // Guided tour highlight calculations
  useEffect(() => {
    if (!activeTour) return;
    const steps = TOUR_CONFIGS[activeTour];
    if (!steps || tourStep >= steps.length) {
      setActiveTour(null);
      confetti({ particleCount: 50, spread: 40 });
      return;
    }

    const currentStep = steps[tourStep];
    const element = document.querySelector(currentStep.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTourStyle({
        position: 'fixed',
        top: `${rect.bottom + window.scrollY + 12}px`,
        left: `${rect.left + window.scrollX}px`,
        zIndex: 9999,
        width: '280px'
      });
      // Scroll to view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add custom highlight ring
      element.classList.add('tour-highlight-active');
    } else {
      // Element not on page, skip to next
      setTourStep(prev => prev + 1);
    }

    return () => {
      if (element) {
        element.classList.remove('tour-highlight-active');
      }
    };
  }, [activeTour, tourStep]);

  const handleStartTour = (tourKey: string) => {
    setActiveTour(tourKey);
    setTourStep(0);
    setIsOpen(false);
  };

  const handleAskBot = (question: string) => {
    setChatMessages(prev => [...prev, { sender: 'user', text: question }]);
    
    // Simulate AI parsing replies
    let response = "I'm analyzing that query against our blockchain documentation. AegisCert registers SHA-256 integrity check hashes directly to digital ledger networks to make credentials fully tamper-resistant.";
    const q = question.toLowerCase();

    if (q.includes('issue')) {
      response = "To issue a certificate:\n1. Choose 'Issue Certificate' in the left menu.\n2. Complete student roll parameters and DOB details.\n3. Upload the marksheet PDF file.\n4. Click commit. The system signs the payload and writes it to the next blockchain block.";
    } else if (q.includes('verify')) {
      response = "To verify a student degree, navigate to the public Verification page, and upload the degree PDF scanner results. The platform validates signatures instantly.";
    } else if (q.includes('fingerprint') || q.includes('fail')) {
      response = "If fingerprint scanning fails: Verify the Mantra MFS100 USB connector status, and restart the local 'Mantra RD Service' daemon on port 11100. Disabling active firewalls can prevent blocked ports.";
    } else if (q.includes('locked')) {
      response = "Accounts are locked for 15 minutes after 5 unsuccessful login attempts to prevent brute-force attacks. Reset password via the recovery console if needed.";
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 800);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleAskBot(chatInput);
    setChatInput('');
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !currentUser) return;

    const tickets = db.getSupportTickets();
    const newTkt: SupportTicket = {
      id: `tkt-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: ticketCategory,
      subject: ticketSubject,
      message: ticketMessage,
      status: 'open',
      timestamp: new Date().toISOString(),
      replies: []
    };
    tickets.unshift(newTkt);
    db.setSupportTickets(tickets);

    setTicketSubject('');
    setTicketMessage('');
    setTicketSubmitted(true);
    confetti({ particleCount: 30, spread: 20 });
    setTimeout(() => setTicketSubmitted(false), 4000);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDesc.trim() || !currentUser) return;

    const feedbackList = db.getFeedback();
    const newFb: Feedback = {
      id: `fb-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: feedbackType,
      title: feedbackTitle,
      description: feedbackDesc,
      timestamp: new Date().toISOString(),
      status: 'open'
    };
    feedbackList.unshift(newFb);
    db.setFeedback(feedbackList);

    setFeedbackTitle('');
    setFeedbackDesc('');
    setFeedbackSubmitted(true);
    confetti({ particleCount: 30, spread: 20 });
    setTimeout(() => setFeedbackSubmitted(false), 4000);
  };

  return (
    <>
      {/* Floating FAB Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group focus:outline-none"
        title="Open AegisAssist (F1)"
      >
        <span className="absolute inset-0 rounded-full bg-primary/30 group-hover:animate-ping -z-10" />
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Side Slide-Over Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md premium-card border-l border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl flex flex-col justify-between animate-fadeIn text-xs">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                <HelpCircle className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-sm leading-none">AegisAssist Center</h3>
                <span className="text-[8px] text-slate-500 tracking-wider">INTELLIGENT SYSTEM CO-PILOT</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 text-[9px] font-bold text-slate-400 p-1 bg-slate-950 overflow-x-auto gap-1">
            {['home', 'search', 'kb', 'ai', 'tour', 'trb', 'faq', 'contact'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Core Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-1">
                  <h4 className="text-white font-bold text-sm">Welcome to AegisAssist</h4>
                  <p className="text-slate-400 leading-relaxed text-3xs">
                    Your direct gateway companion. Ask questions, explore walkthroughs, or log support tickets.
                  </p>
                </div>

                {/* Context Aware Panel */}
                <div className="space-y-3">
                  <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider block">Context-Aware Documentation</span>
                  <div className="space-y-3">
                    {detectedContext.map(art => (
                      <div key={art.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                        <span className="text-white font-bold block">{art.title}</span>
                        <p className="text-[10px] text-slate-400 leading-normal whitespace-pre-line">{art.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEARCH TAB */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search articles, tags, FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
                  />
                </div>

                <div className="space-y-3">
                  {searchResults.map(art => (
                    <div key={art.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl space-y-1.5">
                      <span className="text-white font-bold block">{art.title}</span>
                      <p className="text-slate-400 text-3xs leading-relaxed truncate">{art.body}</p>
                    </div>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-center py-6 text-slate-500">No matching search outcomes found.</p>
                  )}
                </div>
              </div>
            )}

            {/* KNOWLEDGE BASE TAB */}
            {activeTab === 'kb' && (
              <div className="space-y-4">
                {articles.map(art => (
                  <div key={art.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">{art.title}</span>
                      <span className="text-[8px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {art.category}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-normal whitespace-pre-line">{art.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* AI ASSISTANT TAB */}
            {activeTab === 'ai' && (
              <div className="flex flex-col justify-between h-[380px] bg-slate-900/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        m.sender === 'user' 
                          ? 'bg-indigo-600 text-white ml-auto' 
                          : 'bg-slate-800 text-slate-200 mr-auto'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Prompts list */}
                <div className="flex gap-1.5 flex-wrap my-3 text-[9px] font-bold text-slate-400">
                  <button onClick={() => handleAskBot('How do I issue a certificate?')} className="px-2 py-1 bg-slate-800 rounded-lg hover:text-white">
                    Issue Cert?
                  </button>
                  <button onClick={() => handleAskBot('How do I verify a student?')} className="px-2 py-1 bg-slate-800 rounded-lg hover:text-white">
                    Verify?
                  </button>
                  <button onClick={() => handleAskBot('Why is fingerprint authentication failing?')} className="px-2 py-1 bg-slate-800 rounded-lg hover:text-white">
                    Fingerprint?
                  </button>
                </div>

                <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-white/5 pt-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 premium-input text-2xs"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TOUR TAB */}
            {activeTab === 'tour' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block text-sm">Certificate Issuance Walkthrough</span>
                      <p className="text-[10px] text-slate-500">Walks through registrar fields inputs</p>
                    </div>
                    <button 
                      onClick={() => handleStartTour('issuance')}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block text-sm">Ledger Explorer Walkthrough</span>
                      <p className="text-[10px] text-slate-500">Audit blockchain transactions heights</p>
                    </div>
                    <button 
                      onClick={() => handleStartTour('explorer')}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TROUBLESHOOTING TAB */}
            {activeTab === 'trb' && (
              <div className="space-y-4">
                {troubleGuides.map(guide => (
                  <div key={guide.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex gap-2 items-center text-rose-400 font-bold">
                      <AlertOctagon className="w-4 h-4" />
                      <span>{guide.problem}</span>
                    </div>
                    <p className="text-slate-400 text-3xs leading-relaxed"><span className="text-slate-500 font-bold">Reason:</span> {guide.reason}</p>
                    <p className="text-slate-400 text-3xs leading-relaxed"><span className="text-slate-500 font-bold">Resolution:</span> {guide.resolution}</p>
                    <button
                      onClick={() => alert(`Simulating troubleshooting fix: ${guide.recommendedAction}`)}
                      className="mt-1 px-3 py-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-xl text-3xs font-bold transition-all active:scale-95"
                    >
                      {guide.recommendedAction}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ TAB */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {faqs.map(faq => (
                  <div key={faq.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-1.5">
                    <span className="text-white font-bold block">{faq.question}</span>
                    <p className="text-slate-400 leading-relaxed text-3xs">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CONTACT & FEEDBACK TAB */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                
                {/* Contact Ticket Form */}
                <form onSubmit={handleSubmitTicket} className="premium-card p-4 border border-white/10 space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Submit Support Ticket
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MFS100 scanner disconnects"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full px-3 py-2 premium-input text-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Topic Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 premium-input text-2xs bg-slate-900 focus:outline-none"
                    >
                      <option value="Biometrics">Biometrics Scanner</option>
                      <option value="Blockchain">Blockchain Ledger</option>
                      <option value="Account">Account Security</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Message</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe the problem or question..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full px-3 py-2 premium-input text-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {ticketSubmitted && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                        <Check className="w-3.5 h-3.5" />
                        Ticket Sent!
                      </span>
                    )}
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-2xs font-bold ml-auto transition-all active:scale-95 shadow">
                      Send Ticket
                    </button>
                  </div>
                </form>

                {/* Feedback suggestions Form */}
                <form onSubmit={handleSubmitFeedback} className="premium-card p-4 border border-white/10 space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-accent" />
                    Feature Suggestion
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Suggestion Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Export audits to Excel"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      className="w-full px-3 py-2 premium-input text-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Feedback Type</label>
                    <div className="flex gap-2">
                      {['bug', 'feature', 'suggestion'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type as any)}
                          className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-all ${
                            feedbackType === type ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Detailed Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your suggestion or improvement details..."
                      value={feedbackDesc}
                      onChange={(e) => setFeedbackDesc(e.target.value)}
                      className="w-full px-3 py-2 premium-input text-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {feedbackSubmitted && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                        <Check className="w-3.5 h-3.5" />
                        Feedback Logged!
                      </span>
                    )}
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-2xs font-bold ml-auto transition-all active:scale-95 shadow">
                      Log Feedback
                    </button>
                  </div>
                </form>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Guided Tour Tooltip bubble */}
      {activeTour && TOUR_CONFIGS[activeTour] && TOUR_CONFIGS[activeTour][tourStep] && (
        <div style={tourStyle} className="premium-card p-4 border border-indigo-500 bg-slate-950/95 shadow-2xl flex flex-col justify-between text-2xs space-y-3">
          <div className="space-y-1">
            <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
              Step {tourStep + 1} of {TOUR_CONFIGS[activeTour].length}
            </span>
            <span className="text-white font-extrabold text-xs block">{TOUR_CONFIGS[activeTour][tourStep].title}</span>
            <p className="text-slate-300 leading-normal text-3xs font-medium">{TOUR_CONFIGS[activeTour][tourStep].content}</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <button
              onClick={() => setActiveTour(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
            >
              Skip Tour
            </button>
            <button
              onClick={() => setTourStep(prev => prev + 1)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1 transition-all active:scale-95"
            >
              Next Step
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
