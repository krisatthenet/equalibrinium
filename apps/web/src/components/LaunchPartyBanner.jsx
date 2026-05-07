import React, { useState } from 'react';
import { X, PartyPopper, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LaunchPartyBanner = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('launchPartyBannerDismissed') === 'true'
  );

  const { t } = useTranslation();

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('launchPartyBannerDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="relative z-[60] overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white px-4 py-3 flex items-center justify-between gap-3">
        {/* animated shimmer */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] animate-[banner-shimmer_2.5s_linear_infinite]" />

        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight">
            <PartyPopper className="h-5 w-5 shrink-0" />
            <span>{t('banner.launch_title')}</span>
            <Sparkles className="h-4 w-4 shrink-0" />
          </div>
          <span className="hidden sm:block text-white/70">·</span>
          <p className="text-sm sm:text-base font-medium text-white/90">
            {t('banner.launch_desc')}
          </p>
          <Link
            to="/register"
            className="shrink-0 bg-white text-orange-600 font-bold text-sm px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors duration-200 whitespace-nowrap"
          >
            {t('banner.launch_cta')} →
          </Link>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <style>{`
        @keyframes banner-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default LaunchPartyBanner;
