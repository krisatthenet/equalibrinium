import React from 'react';
import { ExternalLink } from 'lucide-react';

const partners = [
  {
    key: 'boilio',
    accent: 'from-orange-400 to-red-500',
    shadow: 'shadow-orange-500/20',
    initial: 'B',
    name: 'boilio.com',
    label: 'Official Partner',
    tagline: 'Hungry after a renovation? Let the professionals cook. 🍽️',
    description: 'Order restaurant-quality meals from top Vilnius chefs — delivered fresh to your door.',
    cta: 'Order now',
    href: 'https://boilio.com',
  },
  {
    key: 'fantastas',
    accent: 'from-violet-500 to-indigo-600',
    shadow: 'shadow-violet-500/20',
    initial: 'F',
    name: 'fantastas.lt',
    label: 'Official Partner',
    tagline: 'Work hard, then roll for initiative. 🎲',
    description: 'Professional Dungeon Masters for hire — unforgettable D&D sessions, from one-shots to full campaigns.',
    cta: 'Find a DM',
    href: 'https://fantastas.lt',
  },
];

const PartnerCard = ({ accent, shadow, initial, name, label, tagline, description, cta, href }) => (
  <div className="relative rounded-2xl overflow-hidden border border-border bg-card flex flex-col sm:flex-row items-center gap-0 h-full">
    {/* accent strip */}
    <div className={`w-full sm:w-2 sm:h-auto h-2 shrink-0 bg-gradient-to-r sm:bg-gradient-to-b ${accent} rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl`} />

    <div className="flex flex-col sm:flex-row items-center gap-5 px-6 py-6 w-full">
      {/* logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md ${shadow}`}>
          <span className="text-white font-black text-lg leading-none">{initial}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-xl font-black text-foreground leading-tight">{name}</p>
        </div>
      </div>

      {/* divider */}
      <div className="hidden sm:block h-10 w-px bg-border shrink-0" />

      {/* copy */}
      <div className="text-center sm:text-left flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-0.5">{tagline}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* CTA */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 flex items-center gap-2 bg-gradient-to-r ${accent} hover:opacity-90 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${shadow} whitespace-nowrap`}
      >
        {cta} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  </div>
);

const PartnersSection = () => (
  <section className="py-12 md:py-16 bg-muted/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
        Our Partners
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {partners.map(p => <PartnerCard key={p.key} {...p} />)}
      </div>
    </div>
  </section>
);

export default PartnersSection;
