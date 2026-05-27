import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Star, MapPin, ArrowUpDown, TrendingDown, Award, Navigation, BadgeCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserImageUrl } from '@/lib/userImage';
import VerifiedBadge from '@/components/VerifiedBadge.jsx';

const deg2rad = d => d * (Math.PI / 180);
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SORT_OPTION_KEYS = [
  { value: 'price',    labelKey: 'bid_comparison.price',    icon: TrendingDown },
  { value: 'rating',   labelKey: 'bid_comparison.rating',   icon: Award },
  { value: 'distance', labelKey: 'bid_comparison.distance', icon: Navigation },
];

const BidComparisonView = ({ bids, bidders, ticket, onAccept, canAccept }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState('price');

  const enriched = useMemo(() => {
    return bids.map(bid => {
      const bidder = bidders[bid.masterId] || null;
      let distance = null;
      if (ticket?.latitude && ticket?.longitude && bidder?.latitude && bidder?.longitude) {
        distance = haversine(ticket.latitude, ticket.longitude, bidder.latitude, bidder.longitude);
      }
      return { bid, bidder, distance };
    });
  }, [bids, bidders, ticket]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      if (sortBy === 'price')    return Number(a.bid.proposedRate) - Number(b.bid.proposedRate);
      if (sortBy === 'rating')   return Number(b.bidder?.rating || 0) - Number(a.bidder?.rating || 0);
      if (sortBy === 'distance') {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      return 0;
    });
  }, [enriched, sortBy]);

  // Highlight badges: cheapest price, highest rating, nearest
  const minPrice    = Math.min(...enriched.map(e => Number(e.bid.proposedRate)));
  const maxRating   = Math.max(...enriched.map(e => Number(e.bidder?.rating || 0)));
  const minDistance = Math.min(...enriched.filter(e => e.distance !== null).map(e => e.distance));

  if (bids.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Sort bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" /> Sort by:
        </span>
        {SORT_OPTION_KEYS.map(({ value, labelKey, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              sortBy === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <Icon className="h-3 w-3" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className={`grid gap-4 ${sorted.length === 1 ? 'grid-cols-1 max-w-sm' : sorted.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {sorted.map(({ bid, bidder, distance }, idx) => {
          const isAccepted  = bid.status === 'accepted';
          const isCheapest  = Number(bid.proposedRate) === minPrice && bids.length > 1;
          const isBestRated = bidder && Number(bidder.rating) === maxRating && maxRating > 0 && bids.length > 1;
          const isNearest   = distance !== null && distance === minDistance && bids.length > 1;
          const avatarUrl   = getUserImageUrl(bidder, { thumb: '200x200' });
          const rating      = bidder?.rating ? Number(bidder.rating).toFixed(1) : null;

          return (
            <div
              key={bid.id}
              className={`relative flex flex-col rounded-2xl border p-5 gap-4 transition-all ${
                isAccepted
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {/* Rank position when sorted */}
              {sorted.length > 1 && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-muted-foreground/50">
                  #{idx + 1}
                </span>
              )}

              {/* Highlight badges */}
              {(isCheapest || isBestRated || isNearest || isAccepted) && (
                <div className="flex flex-wrap gap-1.5 -mb-1">
                  {isAccepted  && <Badge className="bg-primary/20 text-primary border-none text-[10px] px-2 py-0.5">{t('bid_comparison.accepted_badge')}</Badge>}
                  {isCheapest  && !isAccepted && <Badge className="bg-green-500/15 text-green-400 border-none text-[10px] px-2 py-0.5">{t('bid_comparison.lowest_price')}</Badge>}
                  {isBestRated && !isAccepted && <Badge className="bg-yellow-500/15 text-yellow-400 border-none text-[10px] px-2 py-0.5">{t('bid_comparison.highest_rated')}</Badge>}
                  {isNearest   && !isAccepted && <Badge className="bg-sky-500/15 text-sky-400 border-none text-[10px] px-2 py-0.5">{t('bid_comparison.nearest')}</Badge>}
                </div>
              )}

              {/* Contractor info */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={bidder?.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                  }
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/contractor/${bid.masterId}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {bidder?.name || 'Contractor'}
                  </Link>
                  {bidder?.profession && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{bidder.profession}</p>
                  )}
                  {bidder && (bidder.idVerified || bidder.phoneVerified) && (
                    <VerifiedBadge idVerified={bidder.idVerified} phoneVerified={bidder.phoneVerified} size="xs" />
                  )}
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-background rounded-xl py-2.5 px-1">
                  <p className="text-lg font-bold text-primary leading-none">€{bid.proposedRate}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('bid_comparison.price')}</p>
                </div>
                <div className="bg-background rounded-xl py-2.5 px-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <p className="text-lg font-bold text-foreground leading-none">{rating || '—'}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('bid_comparison.rating')}</p>
                </div>
                <div className="bg-background rounded-xl py-2.5 px-1">
                  <p className="text-lg font-bold text-foreground leading-none">
                    {distance !== null ? `${distance.toFixed(0)} km` : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('bid_comparison.distance')}</p>
                </div>
              </div>

              {/* Bid message */}
              {bid.message && (
                <p className="text-xs text-muted-foreground bg-background border border-border rounded-lg p-3 line-clamp-3 italic">
                  "{bid.message}"
                </p>
              )}

              {/* Location */}
              {bidder?.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-2">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{bidder.location}</span>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-1">
                <Link to={`/contractor/${bid.masterId}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-border text-xs rounded-lg">
                    {t('bid_comparison.view_profile')}
                  </Button>
                </Link>
                {canAccept && bid.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => onAccept(bid.id)}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-lg"
                  >
                    {t('bid_comparison.accept')}
                  </Button>
                )}
                {isAccepted && (
                  <div className="flex-1 flex items-center justify-center text-xs font-semibold text-primary">
                    {t('bid_comparison.hired')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BidComparisonView;
