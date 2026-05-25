// Mapping of URL slugs to contractor profession values stored in PocketBase.
// Add new entries here as professions expand.

export const CATEGORY_SLUGS = {
  'plumbers':           { profession: 'Santechnika',        label: 'Plumbers',           labelLt: 'Santechnikai' },
  'plumbing':           { profession: 'Santechnika',        label: 'Plumbers',           labelLt: 'Santechnikai' },
  'electricians':       { profession: 'Elektrika',          label: 'Electricians',       labelLt: 'Elektrikai' },
  'electrical':         { profession: 'Elektrika',          label: 'Electricians',       labelLt: 'Elektrikai' },
  'painters':           { profession: 'Painter',            label: 'Painters',           labelLt: 'Dažytojai' },
  'carpenters':         { profession: 'staliaus paslaugos', label: 'Carpenters',         labelLt: 'Staliai' },
  'cleaners':           { profession: 'Patalptu valymas',   label: 'Cleaners',           labelLt: 'Valytojai' },
  'flooring':           { profession: 'Grindų klojimas',    label: 'Flooring specialists', labelLt: 'Grindų specialistai' },
  'tile-layers':        { profession: 'plyteliu klojimas',  label: 'Tile layers',        labelLt: 'Plytelių klojėjai' },
  'furniture-assembly': { profession: 'Baldų surinkimas',   label: 'Furniture assemblers', labelLt: 'Baldų montuotojai' },
  'finishing-works':    { profession: 'Apdailos darbai',    label: 'Finishing works',    labelLt: 'Apdailininkai' },
  'wallpapering':       { profession: 'Tapetavimas',        label: 'Wallpaperers',       labelLt: 'Tapetavimas' },
  'nannies':            { profession: 'Nanny',              label: 'Nannies',            labelLt: 'Auklės' },
  'tutors':             { profession: 'Teacher',            label: 'Tutors',             labelLt: 'Mokytojai' },
  'coaches':            { profession: 'Coach',              label: 'Coaches',            labelLt: 'Treneriai' },
};

export const LOCATION_SLUGS = {
  'vilnius':    { label: 'Vilnius',     filter: 'vilnius' },
  'kaunas':     { label: 'Kaunas',      filter: 'kaunas' },
  'klaipeda':   { label: 'Klaipėda',   filter: 'klaipėda' },
  'siauliai':   { label: 'Šiauliai',   filter: 'šiauliai' },
  'panevezys':  { label: 'Panevėžys',  filter: 'panevėžys' },
  'alytus':     { label: 'Alytus',     filter: 'alytus' },
  'marijampole':{ label: 'Marijampolė',filter: 'marijampolė' },
  'lithuania':  { label: 'Lithuania',  filter: '' },
};

/**
 * Parse a URL slug like "plumbers-vilnius" or "electricians-lithuania"
 * into { category, location } objects (or null if not recognised).
 */
export function parseSlug(slug) {
  if (!slug) return null;
  const parts = slug.split('-');

  // Try splitting at each hyphen from right → left to handle multi-word categories
  for (let i = parts.length - 1; i >= 1; i--) {
    const locationKey = parts.slice(i).join('-');
    const categoryKey = parts.slice(0, i).join('-');
    if (LOCATION_SLUGS[locationKey] && CATEGORY_SLUGS[categoryKey]) {
      return { category: CATEGORY_SLUGS[categoryKey], location: LOCATION_SLUGS[locationKey], categoryKey, locationKey };
    }
  }

  // No location suffix — whole slug is a category, all Lithuania
  if (CATEGORY_SLUGS[slug]) {
    return { category: CATEGORY_SLUGS[slug], location: LOCATION_SLUGS['lithuania'], categoryKey: slug, locationKey: 'lithuania' };
  }

  return null;
}
