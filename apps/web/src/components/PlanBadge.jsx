import React from 'react';
import { getPlan } from '@/lib/plans';

const PlanBadge = ({ plan, className = '', isTrial = false }) => {
  if (!plan || plan === 'standard') return null;
  const { label, color } = getPlan(plan);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${color} ${className}`}>
      {label}
      {isTrial && <span className="opacity-70">· Trial</span>}
    </span>
  );
};

export default PlanBadge;
