import React from 'react';
import { Rocket } from 'lucide-react';

const BetaBadge = () => (
  <div className="hidden lg:flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-medium">
    <Rocket className="h-3.5 w-3.5 text-primary" />
    <span className="font-bold text-primary">v1.0</span>
    <span className="text-muted-foreground">Live</span>
  </div>
);

export default BetaBadge;