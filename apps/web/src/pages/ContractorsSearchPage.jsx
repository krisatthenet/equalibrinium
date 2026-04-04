import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { Star, MapPin, Map as MapIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration.jsx';

const ContractorsSearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Contractor list sort/filter
  const [sortBy, setSortBy] = useState('rating'); // rating | city | service
  const [filterCity, setFilterCity] = useState('');
  const [filterService, setFilterService] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await pb.collection('categories').getFullList({ $autoCancel: false });
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contractorsData, ticketsData] = await Promise.all([
          pb.collection('contractors').getFullList({
            sort: '-rating',
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

  // Derive unique cities from contractor locations
  const cities = [...new Set(
    contractors.map(c => c.location?.split(',')[0]?.trim()).filter(Boolean)
  )].sort();

  // Apply filters + sort client-side
  const displayedContractors = contractors
    .filter(c => {
      if (filterCity && !c.location?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterService && !c.categories?.includes(filterService)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'city') return (a.location || '').localeCompare(b.location || '');
      if (sortBy === 'service') {
        const catA = categories.find(cat => a.categories?.includes(cat.id))?.name || '';
        const catB = categories.find(cat => b.categories?.includes(cat.id))?.name || '';
        return catA.localeCompare(catB);
      }
      return (b.rating || 0) - (a.rating || 0); // default: rating
    });

  return (
    <>
      <Helmet>
        <title>{t('search.title')} - WorkBee</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-8 text-foreground">{t('search.title')}</h1>

            <Tabs defaultValue="map" className="mb-8">
              <TabsList className="mb-4 bg-card border border-border rounded-lg p-1">
                <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <MapIcon className="w-4 h-4 mr-2" /> {t('search.map_view')}
                </TabsTrigger>
                <TabsTrigger value="contractors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <Users className="w-4 h-4 mr-2" /> Contractors
                </TabsTrigger>
              </TabsList>

              {/* MAP — tickets only, no contractor markers */}
              <TabsContent value="map" className="mt-0">
                <GoogleMapsIntegration
                  contractors={[]}
                  tickets={tickets}
                  onLocationChange={setUserLocation}
                />
              </TabsContent>

              {/* CONTRACTORS LIST */}
              <TabsContent value="contractors" className="mt-0">
                {/* Sort / filter bar */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 bg-input border-border text-foreground rounded-lg">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Sort: Rating</SelectItem>
                      <SelectItem value="city">Sort: City</SelectItem>
                      <SelectItem value="service">Sort: Service</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCity || 'all'} onValueChange={v => setFilterCity(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-44 bg-input border-border text-foreground rounded-lg">
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterService || 'all'} onValueChange={v => setFilterService(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-44 bg-input border-border text-foreground rounded-lg">
                      <SelectValue placeholder="All services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All services</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(filterCity || filterService) && (
                    <Button variant="outline" className="rounded-lg" onClick={() => { setFilterCity(''); setFilterService(''); }}>
                      Clear filters
                    </Button>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
                  </div>
                ) : displayedContractors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedContractors.map(contractor => (
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
                              <span className="text-4xl font-bold text-primary">{contractor.name.charAt(0)}</span>
                            </div>
                          )}
                          {contractor.isPromoted && (
                            <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                              {t('map.promoted')}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-6 flex flex-col flex-1">
                          <h3 className="font-semibold text-xl mb-2 text-foreground">{contractor.name}</h3>
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
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <p className="text-muted-foreground text-lg mb-4">{t('search.no_results')}</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => { setFilterCity(''); setFilterService(''); setSortBy('rating'); }}>
                      {t('search.clear_filters')}
                    </Button>
                  </div>
                )}
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
