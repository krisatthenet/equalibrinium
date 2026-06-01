import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

// Top service × city combinations — chosen for search volume in Lithuania.
// These double as crawlable internal links that let Google discover landing pages.
const TOP_SEARCHES = [
  { label: 'Plumbers in Vilnius',          href: '/plumbers-vilnius' },
  { label: 'Electricians in Vilnius',      href: '/electricians-vilnius' },
  { label: 'Painters in Vilnius',          href: '/painters-vilnius' },
  { label: 'Plumbers in Kaunas',           href: '/plumbers-kaunas' },
  { label: 'Electricians in Kaunas',       href: '/electricians-kaunas' },
  { label: 'Cleaners in Vilnius',          href: '/cleaners-vilnius' },
  { label: 'Carpenters in Vilnius',        href: '/carpenters-vilnius' },
  { label: 'Tile layers in Vilnius',       href: '/tile-layers-vilnius' },
  { label: 'Flooring in Vilnius',          href: '/flooring-vilnius' },
  { label: 'Painters in Kaunas',           href: '/painters-kaunas' },
  { label: 'Cleaners in Kaunas',           href: '/cleaners-kaunas' },
  { label: 'Finishing works in Vilnius',   href: '/finishing-works-vilnius' },
  { label: 'Plumbers in Klaipėda',         href: '/plumbers-klaipeda' },
  { label: 'Electricians in Klaipėda',     href: '/electricians-klaipeda' },
  { label: 'Furniture assembly in Vilnius',href: '/furniture-assembly-vilnius' },
  { label: 'Wallpapering in Vilnius',      href: '/wallpapering-vilnius' },
  { label: 'Tutors in Vilnius',            href: '/tutors-vilnius' },
  { label: 'Coaches in Vilnius',           href: '/coaches-vilnius' },
];

const PopularSearches = () => (
  <section className="py-10 md:py-14 bg-muted/30 border-t border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Popular searches
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TOP_SEARCHES.map(({ label, href }) => (
          <Link
            key={href}
            to={href}
            className="text-sm px-3.5 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:text-primary text-muted-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default PopularSearches;
