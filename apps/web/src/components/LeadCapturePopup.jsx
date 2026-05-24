import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { X, Loader2 } from 'lucide-react';

const SESSION_KEY = 'wb_lead_popup_shown';
const API_URL = import.meta.env.VITE_API_URL || 'https://workbee-api-zfq-production.up.railway.app';

const LeadCapturePopup = () => {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => setVisible(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/reach/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      setDone(true);
      setTimeout(dismiss, 2200);
    } catch (_) {
      dismiss();
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* yellow accent bar */}
        <div className="h-1 w-full bg-amber-400" />

        <div className="bg-card px-8 pt-7 pb-8">
          <button
            onClick={dismiss}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {done ? (
            <div className="text-center py-6">
              <img src="/logo.svg" alt="WorkBee" className="h-14 w-14 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                You're on the list!
              </h3>
              <p className="text-muted-foreground text-sm">We'll be in touch soon. 🐝</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.svg" alt="WorkBee" className="h-10 w-10 shrink-0" />
                <div>
                  <h3
                    className="font-black text-xl leading-tight text-foreground"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Stay in the loop
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Early access updates &amp; specialist tips for Lithuania.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="bg-muted border-border focus-visible:ring-amber-400/50"
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted border-border focus-visible:ring-amber-400/50"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-black text-sm px-6 py-3 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-400/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Keep me posted 🐝'}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors pt-1"
                >
                  No thanks, I'll just browse
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCapturePopup;
