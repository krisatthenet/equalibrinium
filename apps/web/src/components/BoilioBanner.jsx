import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const BoilioBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('boilioBannerDismissed') === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem('boilioBannerDismissed', 'true'); } catch {}
    setDismissed(true);
  };

  return (
    <section className="py-10 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
          {/* dismiss */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-0">
            {/* coloured accent strip */}
            <div className="w-full sm:w-2 sm:h-auto h-2 shrink-0 bg-gradient-to-r sm:bg-gradient-to-b from-orange-400 to-red-500 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl" />

            <div className="flex flex-col sm:flex-row items-center gap-6 px-6 py-6 sm:py-5 w-full">
              {/* logo area */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <span className="text-white font-black text-lg leading-none">B</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Official Partner</p>
                  <p className="text-xl font-black text-foreground leading-tight">boilio.com</p>
                </div>
              </div>

              {/* divider */}
              <div className="hidden sm:block h-10 w-px bg-border shrink-0" />

              {/* copy */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  Hungry after a renovation? Let the professionals cook. 🍽️
                </p>
                <p className="text-sm text-muted-foreground">
                  Order restaurant-quality meals from top Vilnius chefs — delivered fresh to your door.
                </p>
              </div>

              {/* CTA */}
              <a
                href="https://boilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-orange-500/20 whitespace-nowrap"
              >
                Order now <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoilioBanner;
