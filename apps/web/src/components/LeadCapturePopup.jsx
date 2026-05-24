import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      setTimeout(dismiss, 2000);
    } catch (_) {
      dismiss();
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🐝</div>
            <h3 className="text-xl font-bold text-foreground mb-1">You're on the list!</h3>
            <p className="text-muted-foreground text-sm">We'll be in touch soon.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="text-3xl mb-3">🐝</div>
              <h3 className="text-xl font-bold text-foreground mb-1">Stay in the loop</h3>
              <p className="text-muted-foreground text-sm">
                Get early access updates and tips for finding the best specialists in Lithuania.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-name">Name</Label>
                <Input
                  id="lead-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl mt-1" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Keep me posted'}
              </Button>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors py-1"
              >
                No thanks, I'll just browse
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadCapturePopup;
