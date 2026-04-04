import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { Star, MapPin, Map as MapIcon, Users, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration.jsx';

const ContractorsSearchPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [cityQuery, setCityQuery] = useState(searchParams.get('city') || '');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contractorsData, ticketsData] = await Promise.all([
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
          })
        ]);
        setContractors(contractorsData);
        setTickets(ticketsData.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = contractors.filter(c => {
    const kw = keyword.toLowerCase();
    const city = cityQuery.toLowerCase();
    const matchesKeyword = !kw || [
      c.name, c.profession, c.bio,
      ...(c.expand?.categories?.map(cat => cat.name) || [])
    ].some(field => field?.toLowerCase().includes(kw));
    const matchesCity = !city || c.location?.toLowerCase().includes(city);
    return matchesKeyword && matchesCity;
  });

  const hasFilters = keyword || cityQuery;

  return (
    <>
      <Helmet>
        <title>{t('search.title')} - WorkBee</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-foreground">{t('search.title')}</h1>
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
                {/* Search bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search by name, skill, or task..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      className="pl-9 bg-input border-border text-foreground rounded-xl h-11"
                    />
                  </div>
                  <div className="relative sm:w-64">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="City or area..."
                      value={cityQuery}
                      onChange={e => setCityQuery(e.target.value)}
                      className="pl-9 bg-input border-border text-foreground rounded-xl h-11"
                    />
                  </div>
                  {hasFilters && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 px-4 shrink-0"
                      onClick={() => { setKeyword(''); setCityQuery(''); }}
                    >
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
                  </div>
                ) : filtered.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filtered.length} contractor{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' found' : ' available'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map(contractor => (
                        <Card key={contractor.id} className="bg-card border-border hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 hover:-translate-y-1 overflow-hidden h-full flex flex-col rounded-2xl">
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {contractor.profilePicture ? (
                              <img
                                src={pb.files.getUrl(contractor, contractor.profilePicture)}
                                alt={contractor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <span className="text-4xl font-bold text-primary">{contractor.name?.charAt(0)}</span>
                              </div>
                            )}
                            {contractor.isPromoted && (
                              <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                {t('map.promoted')}
                              </div>
                            )}
                          </div>
                          <CardContent className="p-6 flex flex-col flex-1">
                            <h3 className="font-semibold text-xl mb-1 text-foreground">{contractor.name}</h3>
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
                            {contractor.hourlyRate > 0 && (
                              <p className="text-lg font-semibold text-primary mb-4">€{contractor.hourlyRate}/hr</p>
                            )}
                            <Button className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" asChild>
                              <Link to={`/contractor/${contractor.id}`}>{t('home.view_profile')}</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-4">{t('search.no_results')}</p>
                    {hasFilters && (
                      <Button variant="outline" className="rounded-xl" onClick={() => { setKeyword(''); setCityQuery(''); }}>
                        {t('search.clear_filters')}
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                <GoogleMapsIntegration
                  contractors={[]}
                  tickets={tickets}
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
