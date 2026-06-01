import React from 'react';
import { ExternalLink } from 'lucide-react';

const partners = [
  {
    key: 'boilio',
    accent: 'from-orange-400 to-red-500',
    border: 'border-orange-500/30',
    shadow: 'shadow-orange-500/10',
    btnShadow: 'shadow-orange-500/20',
    initial: 'B',
    name: 'boilio.com',
    tagline: 'Hungry after a renovation? Let the professionals cook. 🍽️',
    description: 'Order restaurant-quality meals from top Vilnius chefs — delivered fresh to your door.',
    cta: 'Order now',
    href: 'https://boilio.com',
  },
  {
    key: 'fantastas',
    accent: 'from-violet-500 to-indigo-600',
    border: 'border-violet-500/30',
    shadow: 'shadow-violet-500/10',
    btnShadow: 'shadow-violet-500/20',
    initial: 'F',
    name: 'fantastas.lt',
    tagline: 'Work hard, then roll for initiative. 🎲',
    description: 'Professional Dungeon Masters for hire — unforgettable D&D sessions, from one-shots to full campaigns.',
    cta: 'Find a DM',
    href: 'https://fantastas.lt',
  },
  {
    key: 'columbus',
    accent: 'from-yellow-500 to-amber-600',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/10',
    btnShadow: 'shadow-amber-500/20',
    initial: 'C',
    name: 'Columbus Records',
    tagline: 'Creativity, collaboration, passion. 🎵',
    description: "Lithuanian hip-hop, trap & garage rock label — producing original music and live events with artists across Lithuania.",
    cta: 'Discover artists',
    href: 'https://columbus-records.com',
  },
];

const PartnerCard = ({ accent, border, shadow, btnShadow, initial, name, tagline, description, cta, href }) => (
  <div className={`rounded-2xl border ${border} bg-card overflow-hidden flex flex-col shadow-lg ${shadow}`}>
    {/* top accent bar */}
    <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

    <div className="flex flex-col flex-1 p-6 gap-4">
      {/* logo + name */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md ${btnShadow} shrink-0`}>
          <span className="text-white font-black text-lg leading-none">{initial}</span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-1">Official Partner</p>
          <p className="text-base font-black text-foreground leading-tight">{name}</p>
        </div>
      </div>

      {/* copy */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground mb-1">{tagline}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* CTA */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`self-start flex items-center gap-2 bg-gradient-to-r ${accent} hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${btnShadow}`}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {partners.map(p => <PartnerCard key={p.key} {...p} />)}
      </div>
    </div>
  </section>
);

export default PartnersSection;
