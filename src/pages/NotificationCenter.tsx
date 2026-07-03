import React, { useState, useEffect } from 'react';
import { db, PushNotification, User } from '../services/db';
import { Bell, ShieldCheck, Mail, AlertTriangle, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NotificationCenter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  // Toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;
    setCurrentUser(user);

    // Load notifications for user
    const notes = db.getNotifications().filter(n => n.userId === user.id || n.userId === 'all');
    setNotifications(notes);
  }, []);

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    
    // Save to DB
    const allNotes = db.getNotifications();
    const activeUserNotes = allNotes.map(n => {
      if (n.userId === currentUser?.id || n.userId === 'all') {
        return { ...n, read: true };
      }
      return n;
    });
    db.setNotifications(activeUserNotes);
    confetti({ particleCount: 30, spread: 20 });
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    
    // Remove from DB for this user
    const allNotes = db.getNotifications();
    const filtered = allNotes.filter(n => n.userId !== currentUser?.id && n.userId !== 'all');
    db.setNotifications(filtered);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-8 h-8 text-primary" />
            Security Notification Center
          </h1>
          <p className="text-sm text-slate-400">
            Audit system alerts, credential sync notifications, and administrative updates.
          </p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Notifications list */}
        <div className="lg:col-span-7 premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400 animate-pulse" />
              Inbox ({notifications.filter(n => !n.read).length} Unread)
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={handleClearNotifications}
                className="text-2xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Inbox
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {notifications.map(note => (
              <div 
                key={note.id} 
                className={`p-4 rounded-2xl border flex gap-3 text-xs items-start transition-all ${
                  note.read 
                    ? 'bg-slate-900/30 border-white/5 text-slate-400' 
                    : 'bg-indigo-950/20 border-indigo-500/20 text-slate-200'
                }`}
              >
                {note.severity === 'high' || note.severity === 'critical' ? (
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-xs ${note.read ? 'text-slate-400' : 'text-white'}`}>{note.title}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{new Date(note.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">{note.body}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                No notification alerts recorded. Continuity status is nominal.
              </div>
            )}
          </div>
        </div>

        {/* Configuration settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card border border-white/10 rounded-3xl p-6 bg-slate-950/40 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Mail className="w-5 h-5 text-accent" />
              Alert Dispatch Rules
            </h2>

            <div className="space-y-5 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5 rounded-2xl">
                <div>
                  <span className="font-bold text-slate-200 block">Desktop Notification Sync</span>
                  <p className="text-[9px] text-slate-500">Simulate push alerts inside sandbox panels</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-10 h-5 rounded-full bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-900/60 border border-white/5 rounded-2xl">
                <div>
                  <span className="font-bold text-slate-200 block">Critical Email OTP Dispatches</span>
                  <p className="text-[9px] text-slate-500">Sends MFA passcode OTP during recoveries</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-10 h-5 rounded-full bg-slate-900 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
