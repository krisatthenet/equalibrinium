import React, { useState, useEffect } from 'react';
import { PageMeta } from '@/components/PageMeta.jsx';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { getUserImageUrl } from '@/lib/userImage';
import { Star, MapPin, Map as MapIcon, Users, Search, X, Navigation, SlidersHorizontal, ShieldCheck, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration.jsx';
import VerifiedBadge from '@/components/VerifiedBadge.jsx';

const deg2rad = d => d * (Math.PI / 180);
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RADIUS_OPTIONS = [
  { value: 'any',        label: 'Any distance' },
  { value: '5',         label: 'Within 5 km' },
  { value: '10',        label: 'Within 10 km' },
  { value: '25',        label: 'Within 25 km' },
  { value: '50',        label: 'Within 50 km' },
  { value: '100',       label: 'Within 100 km' },
  { value: 'lithuania', label: '🇱🇹 All Lithuania' },
];

const ContractorsSearchPage = () => {
  const { t } = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [cityQuery, setCityQuery] = useState(searchParams.get('city') || '');
  const [radius, setRadius] = useState('any');
  const categoryParam = searchParams.get('category') || '';

  useEffect(() => {
    if (!isAuthenticated || currentUser?.userType !== 'client') return;
    pb.collection('saved_searches').getFullList({
      filter: `userId = "${currentUser.id}"`,
      $autoCancel: false,
    }).then(setSavedSearches).catch(() => {});
  }, [isAuthenticated, currentUser]);

  const buildLabel = () => {
    const parts = [];
    if (keyword.trim()) parts.push(keyword.trim());
    else if (categoryParam) {
      const cat = categories.find(c => c.id === categoryParam);
      if (cat) parts.push(cat.name);
    }
    if (cityQuery.trim()) parts.push(`in ${cityQuery.trim()}`);
    return parts.join(' · ') || 'All contractors';
  };

  const isAlreadySaved = savedSearches.some(s =>
    s.categoryId === (categoryParam || '') &&
    (s.location || '').toLowerCase() === cityQuery.toLowerCase().trim() &&
    (s.keyword || '').toLowerCase() === keyword.toLowerCase().trim()
  );

  const handleSaveSearch = async () => {
    if (!isAuthenticated) { toast({ title: 'Sign in to save searches' }); return; }
    setSaveLoading(true);
    try {
      const rec = await pb.collection('saved_searches').create({
        userId: currentUser.id,
        label: buildLabel(),
        categoryId: categoryParam || '',
        location: cityQuery.trim(),
        keyword: keyword.trim(),
      }, { $autoCancel: false });
      setSavedSearches(prev => [...prev, rec]);
      toast({ title: 'Search saved', description: `You'll be notified when "${buildLabel()}" matches appear.` });
    } catch {
      toast({ title: 'Could not save search', variant: 'destructive' });
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contractorsData, ticketsData, categoriesData] = await Promise.all([
          pb.collection('users').getFullList({
            filter: 'userType = "contractor"',
            sort: '-rating',
            expand: 'categories',
            $autoCancel: false
          }),
          pb.collection('auction_tickets').getList(1, 100, {
            filter: 'status="Open"',
            expand: 'categoryId',
            $autoCancel: false
          }),
          pb.collection('categories').getFullList({ $autoCancel: false })
        ]);
        setContractors(contractorsData);
        setTickets(ticketsData.items);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const getDistance = (contractor) => {
    if (!userLocation || !contractor.latitude || !contractor.longitude) return null;
    return haversine(userLocation.lat, userLocation.lng, contractor.latitude, contractor.longitude);
  };

  const filtered = contractors
    .filter(c => {
      const kw = keyword.toLowerCase();
      const city = cityQuery.toLowerCase();
      const matchesKeyword = !kw || [
        c.name, c.profession, c.bio,
        ...(c.expand?.categories?.map(cat => cat.name) || [])
      ].some(field => field?.toLowerCase().includes(kw));
      const matchesCity = !city || c.location?.toLowerCase().includes(city);
      const categoryName = categories.find(cat => cat.id === categoryParam)?.name?.toLowerCase();
      const matchesCategory = !categoryParam ||
        c.expand?.categories?.some(cat => cat.id === categoryParam) ||
        c.categories?.includes(categoryParam) ||
        (categoryName && c.profession?.toLowerCase() === categoryName);

      // Radius filter
      if (radius !== 'any' && radius !== 'lithuania') {
        if (!userLocation) return matchesKeyword && matchesCity && matchesCategory;
        const dist = getDistance(c);
        if (dist === null || dist > Number(radius)) return false;
      }

      return matchesKeyword && matchesCity && matchesCategory;
    })
    .sort((a, b) => {
      // Paid plan contractors always appear first
      const planRank = { ultra: 0, premium: 1, elite: 2, vip: 3, standard: 4 };
      const pa = planRank[a.plan] ?? 4;
      const pb = planRank[b.plan] ?? 4;
      if (pa !== pb) return pa - pb;

      if (radius !== 'any' && radius !== 'lithuania' && userLocation) {
        const da = getDistance(a) ?? Infinity;
        const db = getDistance(b) ?? Infinity;
        return da - db;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

  const hasFilters = keyword || cityQuery || categoryParam || radius !== 'any';

  return (
    <>
      <PageMeta title={`${t('search.title')} - WorkBee`} description="Find verified contractors for your home renovation and improvement projects." />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-foreground">{t('search.title')}</h1>
              <p className="text-muted-foreground">Find the right professional for your job, sorted by reputation.</p>
            </div>

            <Tabs defaultValue="contractors" className="mb-8">
              <TabsList className="mb-6 bg-card border border-border rounded-lg p-1">
                <TabsTrigger value="contractors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <Users className="w-4 h-4 mr-2" /> Contractors
                </TabsTrigger>
                <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <MapIcon className="w-4 h-4 mr-2" /> {t('search.map_view')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contractors" className="mt-0">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search by name, skill, or task..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      className="pl-9 bg-input border-border text-foreground rounded-xl h-11"
                    />
                  </div>
                  <div className="relative sm:w-52">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="City or area..."
                      value={cityQuery}
                      onChange={e => setCityQuery(e.target.value)}
                      className="pl-9 bg-input border-border text-foreground rounded-xl h-11"
                    />
                  </div>

                  {/* Radius filter */}
                  <div className="flex gap-2 items-center">
                    <Select value={radius} onValueChange={setRadius}>
                      <SelectTrigger className="w-48 h-11 rounded-xl bg-input border-border text-foreground">
                        <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RADIUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {radius !== 'any' && !userLocation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-xl px-3 shrink-0"
                        onClick={requestLocation}
                        disabled={locating}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {locating ? 'Locating…' : 'Use my location'}
                      </Button>
                    )}
                    {userLocation && (
                      <Badge variant="secondary" className="h-7 text-xs">
                        <Navigation className="h-3 w-3 mr-1" /> Located
                      </Badge>
                    )}
                  </div>

                  {hasFilters && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 px-4 shrink-0"
                      onClick={() => { setKeyword(''); setCityQuery(''); setRadius('any'); }}
                    >
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                  {hasFilters && isAuthenticated && currentUser?.userType === 'client' && (
                    <Button
                      variant={isAlreadySaved ? 'secondary' : 'outline'}
                      className="rounded-xl h-11 px-4 shrink-0"
                      onClick={handleSaveSearch}
                      disabled={saveLoading || isAlreadySaved}
                    >
                      {isAlreadySaved
                        ? <><BookmarkCheck className="h-4 w-4 mr-1.5 text-primary" /> Saved</>
                        : <><Bookmark className="h-4 w-4 mr-1.5" /> Save search</>
                      }
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
                  </div>
                ) : filtered.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filtered.length} contractor{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' found' : ' available'}
                      {radius !== 'any' && radius !== 'lithuania' && userLocation && ` within ${radius} km`}
                      {radius === 'lithuania' && ' across Lithuania'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map(contractor => {
                        const dist = getDistance(contractor);
                        return (
                          <Card key={contractor.id} className="bg-card border-border hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 hover:-translate-y-1 overflow-hidden h-full flex flex-col rounded-2xl">
                            <div className="aspect-square bg-muted relative overflow-hidden">
                              {getUserImageUrl(contractor) ? (
                                <img
                                  src={getUserImageUrl(contractor, { thumb: '400x400' })}
                                  alt={contractor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <span className="text-4xl font-bold text-primary">{contractor.name?.charAt(0)}</span>
                                </div>
                              )}
                              {contractor.plan && contractor.plan !== 'standard' && (
                                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Pro
                                </div>
                              )}
                              {dist !== null && (
                                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                  <Navigation className="h-3 w-3 text-primary" />
                                  {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                                </div>
                              )}
                            </div>
                            <CardContent className="p-6 flex flex-col flex-1">
                              <h3 className="font-semibold text-xl mb-1 text-foreground">{contractor.name}</h3>
                              {(contractor.idVerified || contractor.phoneVerified || (contractor.plan && contractor.plan !== 'standard')) && (
                                <div className="mb-1.5">
                                  <VerifiedBadge idVerified={contractor.idVerified} phoneVerified={contractor.phoneVerified} plan={contractor.plan} size="xs" />
                                </div>
                              )}
                              {contractor.profession && (
                                <p className="text-sm text-primary font-medium mb-2">{contractor.profession}</p>
                              )}
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span className="font-medium text-foreground">{contractor.rating?.toFixed(1) || '0.0'}</span>
                                <span className="text-sm text-muted-foreground">({contractor.reviewCount || 0} reviews)</span>
                              </div>
                              {contractor.location && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                  <span className="line-clamp-2">{contractor.location}</span>
                                </div>
                              )}
                              {contractor.serviceRadius && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                  <SlidersHorizontal className="h-3 w-3" />
                                  <span>
                                    {contractor.serviceRadius === 'lithuania'
                                      ? 'Serves all Lithuania'
                                      : `Serves within ${contractor.serviceRadius} km`}
                                  </span>
                                </div>
                              )}
                              <Button className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" asChild>
                                <Link to={`/contractor/${contractor.id}`}>{t('home.view_profile')}</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-4">{t('search.no_results')}</p>
                    {hasFilters && (
                      <Button variant="outline" className="rounded-xl" onClick={() => { setKeyword(''); setCityQuery(''); setRadius('any'); }}>
                        {t('search.clear_filters')}
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                <GoogleMapsIntegration
                  contractors={filtered}
                  tickets={tickets}
                  radius={radius !== 'any' && radius !== 'lithuania' ? radius : undefined}
                  onLocationChange={setUserLocation}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ContractorsSearchPage;
