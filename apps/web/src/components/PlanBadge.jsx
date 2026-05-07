import React from 'react';
import { getPlan } from '@/lib/plans';

const PlanBadge = ({ plan, className = '' }) => {
  if (!plan || plan === 'standard') return null;
  const { label, color } = getPlan(plan);
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${color} ${className}`}>
      {label}
    </span>
  );
};

export default PlanBadge;
