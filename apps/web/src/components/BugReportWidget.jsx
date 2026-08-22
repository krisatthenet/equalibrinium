import React, { useState } from 'react';
import { Bug, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';

const BugReportWidget = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const reset = () => {
    setDescription('');
    setEmail('');
    setSent(false);
    setError(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 200);
  };

  const submit = async () => {
    const text = description.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(false);

    try {
      await pb.collection('cs_tickets').create({
        source: 'bug',
        priority: 'normal',
        status: 'open',
        subject: `Bug report — ${window.location.pathname}`,
        message: `${text}\n\n— Reported from ${window.location.href}\nUser agent: ${navigator.userAgent}`,
        userId: currentUser?.id || '',
        name: currentUser?.name || '',
        email: currentUser?.email || email.trim(),
      }, { $autoCancel: false });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Report a bug"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        {open ? <X className="h-6 w-6" /> : <Bug className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          <div className="bg-foreground/5 px-4 py-3 flex items-center gap-3 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <Bug className="h-4 w-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Report a bug</p>
              <p className="text-xs text-muted-foreground">Tell us what went wrong</p>
            </div>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            {sent ? (
              <div className="flex flex-col items-center text-center gap-2 py-6">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-sm text-foreground font-medium">Thanks for the report!</p>
                <p className="text-xs text-muted-foreground">Our team will take a look.</p>
                <button onClick={close} className="mt-2 text-xs text-primary hover:underline">
                  Close
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What did you expect instead?"
                  rows={4}
                  disabled={loading}
                  className="w-full text-sm bg-input border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 resize-none"
                />
                {!currentUser && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (optional, so we can follow up)"
                    disabled={loading}
                    className="w-full text-sm bg-input border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  />
                )}
                {error && (
                  <p className="text-xs text-orange-400">Something went wrong — please try again.</p>
                )}
                <button
                  onClick={submit}
                  disabled={!description.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl px-3 py-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BugReportWidget;
