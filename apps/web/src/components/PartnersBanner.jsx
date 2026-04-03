import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PartnersBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('partnersBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('partnersBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[hsl(var(--banner-bg))] text-[hsl(var(--banner-text))] px-4 py-2.5 flex items-center justify-between text-sm font-medium relative z-[60]">
      <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6">
        <span className="font-semibold">{t('banner.partners')}</span>
        <Link 
          to="/register?type=influencer" 
          className="flex items-center gap-1.5 bg-black/10 hover:bg-black/20 px-3 py-1 rounded-full transition-colors duration-200 font-bold"
        >
          {t('banner.join')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <button 
        onClick={dismiss} 
        className="p-1 hover:bg-black/10 rounded-full transition-colors duration-200 flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PartnersBanner;