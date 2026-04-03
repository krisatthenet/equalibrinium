import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket } from 'lucide-react';

const BetaBadge = () => {
  const { t } = useTranslation();
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const targetDate = new Date('2026-06-30T23:59:59');
    const today = new Date();
    const diffTime = Math.max(targetDate - today, 0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-medium">
      <div className="p-1.5 bg-primary/20 rounded-full">
        <Rocket className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-primary">{t('beta.soft_launch')}</span>
        <span className="text-muted-foreground">
          {t('beta.full_release')} <span className="font-semibold text-foreground">({t('beta.days_left', { days: daysLeft })})</span>
        </span>
      </div>
    </div>
  );
};

export default BetaBadge;