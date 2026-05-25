import React from 'react';

const BetaBadge = () => (
  <div className="hidden lg:flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-medium">
    <span className="text-sm leading-none">🎂</span>
    <span className="font-bold text-primary">v2.4</span>
    <span className="text-muted-foreground">Live</span>
  </div>
);

export default BetaBadge;
