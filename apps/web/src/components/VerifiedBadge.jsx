import React from 'react';
import { ShieldCheck, Phone } from 'lucide-react';

const VerifiedBadge = ({ idVerified, phoneVerified, size = 'sm' }) => {
  const iconClass = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textClass = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  const padClass  = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {idVerified && (
        <span
          title="ID Verified"
          className={`inline-flex items-center gap-1 ${padClass} rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 font-medium ${textClass}`}
        >
          <ShieldCheck className={iconClass} strokeWidth={2.5} />
          ID Verified
        </span>
      )}
      {phoneVerified && (
        <span
          title="Phone Verified"
          className={`inline-flex items-center gap-1 ${padClass} rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 font-medium ${textClass}`}
        >
          <Phone className={iconClass} strokeWidth={2.5} />
          Phone Verified
        </span>
      )}
    </span>
  );
};

export default VerifiedBadge;
