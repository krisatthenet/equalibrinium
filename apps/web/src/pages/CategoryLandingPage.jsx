import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { getUserImageUrl } from '@/lib/userImage';
import { parseSlug, CATEGORY_SLUGS, LOCATION_SLUGS } from '@/lib/categoryLanding.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import VerifiedBadge from '@/components/VerifiedBadge.jsx';
import PlanBadge from '@/components/PlanBadge.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, ChevronRight, Users, BadgeCheck } from 'lucide-react';

const ContractorCard = ({ contractor }) => {
  const avatarUrl = getUserImageUrl(contractor, { thumb: '200x200' });
  const rating = contractor.rating ? Number(contractor.rating).toFixed(1) : null;

  return (
    <Link
      to={`/contractor/${contractor.id}`}
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={contractor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
            {contractor.name?.charAt(0) || '?'}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
            {contractor.name}
          </h3>
          <PlanBadge plan={contractor.plan} />
        </div>

        {contractor.profession && (
          <p className="text-sm text-primary font-medium">{contractor.profession}</p>
        )}

        <VerifiedBadge idVerified={contractor.idVerified} phoneVerified={contractor.phoneVerified} size="xs" />

        {contractor.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{contractor.location}</span>
          </p>
        )}

        {rating && (
          <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-sm font-semibold text-foreground">{rating}</span>
            {contractor.reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">({contractor.reviewCount} reviews)</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  </div>
);

// Friendly description templates for the hero
const DESCRIPTIONS = {
  plumbers:           'Find trusted plumbers near you. From emergency repairs to full installations — get competitive bids from vetted professionals.',
  electricians:       'Connect with certified electricians for any job. Rewiring, fault-finding, new installations — get quotes fast.',
  painters:           'Transform your space with skilled painters. Interior, exterior, or specialist finishes — find the right pro.',
  carpenters:         'From custom furniture to structural work — find experienced carpenters who deliver quality craftsmanship.',
  cleaners:           'Reliable professional cleaners for homes and offices. One-off, regular, or end-of-tenancy cleans.',
  flooring:           'Expert flooring specialists for hardwood, laminate, vinyl, and more. Get a quote from local professionals.',
  'tile-layers':      'Professional tile laying for kitchens, bathrooms, and more. Precision finish, competitive rates.',
  'furniture-assembly': 'Save time — let a professional assemble your furniture. Fast, careful, and affordable.',
  'finishing-works':  'Quality interior finishing for new builds and renovations. Find skilled tradespeople for the final touches.',
  wallpapering:       'Professional wallpapering services — pattern matching, feature walls, full rooms. Quality finish guaranteed.',
  nannies:            'Trusted, vetted nannies for childcare. Find experienced professionals who care.',
  tutors:             'Qualified tutors across all subjects and age groups. Boost grades with personalised sessions.',
  coaches:            'Personal coaches for sport, wellness, and life goals. Find your ideal coach nearby.',
};

const CategoryLandingPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);

  const parsed = parseSlug(categorySlug);

  useEffect(() => {
    if (!parsed) return;

    const { category, location } = parsed;

    const fetchContractors = async () => {
      setLoading(true);
      try {
        let filter = `userType = "contractor" && profession ~ "${category.profession}"`;
        if (location.filter) {
          filter += ` && location ~ "${location.filter}"`;
        }

        const records = await pb.collection('users').getFullList({
          filter,
          sort: '-rating',
          $autoCancel: false,
        });

        // Enrich with review counts
        const withCounts = await Promise.all(
          records.map(async (c) => {
            try {
              const res = await pb.collection('reviews').getList(1, 1, {
                filter: `contractorId = "${c.id}"`,
                $autoCancel: false,
              });
              return { ...c, reviewCount: res.totalItems };
            } catch {
              return { ...c, reviewCount: 0 };
            }
          })
        );

        setContractors(withCounts);
      } catch (err) {
        console.error('CategoryLandingPage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, [categorySlug]);

  // Unknown slug — let the 404 page handle it
  if (!parsed && !loading) {
    navigate('/404', { replace: true });
    return null;
  }

  if (!parsed) return null;

  const { category, location, categoryKey } = parsed;
  const title = location.filter
    ? `${category.label} in ${location.label}`
    : `${category.label} in Lithuania`;
  const description = DESCRIPTIONS[categoryKey]
    || `Find professional ${category.label.toLowerCase()} in ${location.label}. Get competitive bids from vetted contractors on WorkBee.`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: `https://workbee.space/${categorySlug}`,
    numberOfItems: contractors.length,
    itemListElement: contractors.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: c.name,
        url: `https://workbee.space/contractor/${c.id}`,
        ...(c.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(c.rating).toFixed(1), reviewCount: c.reviewCount || 1 } }),
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{title} — WorkBee</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} — WorkBee`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`https://workbee.space/${categorySlug}`} />
        <link rel="canonical" href={`https://workbee.space/${categorySlug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-card/50">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/contractors" className="hover:text-foreground transition-colors">Contractors</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{title}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{description}</p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/register?type=client">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-8">
                  Post a Job — Get Bids
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span>Free to post · No commitment</span>
              </div>
            </div>
          </div>
        </section>

        {/* Location chips */}
        <section className="border-b border-border bg-background">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs text-muted-foreground shrink-0 mr-1">Also available in:</span>
            {Object.entries(LOCATION_SLUGS)
              .filter(([key]) => key !== parsed.locationKey)
              .map(([key, loc]) => (
                <Link
                  key={key}
                  to={`/${parsed.categoryKey}-${key}`}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary text-muted-foreground transition-colors bg-card"
                >
                  {loc.label}
                </Link>
              ))}
          </div>
        </section>

        {/* Contractor grid */}
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {loading ? 'Loading…' : `${contractors.length} professional${contractors.length !== 1 ? 's' : ''} found`}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              Sorted by rating
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No contractors found yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first — post a job and contractors will bid for your work.
              </p>
              <Link to="/register?type=client">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full">
                  Post a Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {contractors.map(c => <ContractorCard key={c.id} contractor={c} />)}
            </div>
          )}
        </section>

        {/* SEO content block */}
        <section className="border-t border-border bg-card/30">
          <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">How WorkBee works</h2>
              <ol className="space-y-4">
                {[
                  ['Post your job', 'Describe what you need — it takes under 2 minutes and is completely free.'],
                  ['Receive bids', `Local ${category.label.toLowerCase()} review your job and send competitive quotes.`],
                  ['Pick your professional', 'Compare profiles, ratings, and verified badges, then choose with confidence.'],
                ].map(([step, detail], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-foreground">{step}</p>
                      <p className="text-sm text-muted-foreground">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Why choose WorkBee</h2>
              <ul className="space-y-3">
                {[
                  'Verified contractor profiles with ID and phone checks',
                  'Transparent reviews from real clients',
                  'Competitive bids — you set the terms',
                  'In-app messaging to coordinate the job',
                  'Free to post, no hidden fees for clients',
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default CategoryLandingPage;
