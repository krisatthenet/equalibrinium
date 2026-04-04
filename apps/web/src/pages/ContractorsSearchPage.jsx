import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { Star, MapPin, Map as MapIcon, List } from 'lucide-react';
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
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    search: searchParams.get('search') || '',
    sort: 'rating',
    radius: 'any'
  });

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
        let filterQuery = '';
        const filterParts = [];

        if (filters.category) {
          filterParts.push(`categories ~ "${filters.category}"`);
        }

        if (filters.location) {
          filterParts.push(`location ~ "${filters.location}"`);
        }

        if (filters.search) {
          filterParts.push(`(name ~ "${filters.search}" || bio ~ "${filters.search}")`);
        }

        if (filterParts.length > 0) {
          filterQuery = filterParts.join(' && ');
        }

        const sortField = filters.sort === 'rating' ? '-rating' : '-reviewCount';

        const [contractorsData, ticketsData] = await Promise.all([
          pb.collection('contractors').getList(1, 50, {
            filter: filterQuery,
            sort: sortField,
            $autoCancel: false
          }),
          pb.collection('auction_tickets').getList(1, 50, {
            filter: 'status="Open"',
            expand: 'categoryId',
            $autoCancel: false
          })
        ]);

        let filteredContractors = contractorsData.items;

        if (filters.radius !== 'any' && userLocation) {
          const radiusKm = parseInt(filters.radius);
          filteredContractors = filteredContractors.filter(contractor => {
            if (!contractor.latitude || !contractor.longitude) return false;
            const dist = calculateDistance(
              userLocation.lat, userLocation.lng,
              contractor.latitude, contractor.longitude
            );
            contractor.distance = dist;
            return dist <= radiusKm;
          });
          
          filteredContractors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        setContractors(filteredContractors);
        setTickets(ticketsData.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, userLocation]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    const newParams = new URLSearchParams(searchParams);
    if (value && key !== 'radius') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleLocationSelect = (placeDetails) => {
    setUserLocation({ lat: placeDetails.lat, lng: placeDetails.lng });
    handleFilterChange('location', placeDetails.address);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

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

            <div className="flex flex-wrap gap-4 mb-8">
              <Select
                value={filters.category || undefined}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-48 bg-input border-border text-foreground rounded-lg">
                  <SelectValue placeholder={t('search.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(cat => cat && cat.id)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filters.radius} onValueChange={(value) => handleFilterChange('radius', value)}>
                <SelectTrigger className="w-40 bg-input border-border text-foreground rounded-lg">
                  <SelectValue placeholder={t('search.radius_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t('search.radius_any')}</SelectItem>
                  <SelectItem value="5">{t('search.radius_5')}</SelectItem>
                  <SelectItem value="10">{t('search.radius_10')}</SelectItem>
                  <SelectItem value="25">{t('search.radius_25')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="map" className="mb-8">
              <TabsList className="mb-4 bg-card border border-border rounded-lg p-1">
                <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <MapIcon className="w-4 h-4 mr-2" /> {t('search.map_view')}
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  <List className="w-4 h-4 mr-2" /> {t('search.list_view')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-0">
                <GoogleMapsIntegration 
                  contractors={contractors} 
                  tickets={tickets}
                  radius={filters.radius} 
                  onLocationChange={setUserLocation} 
                />
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-96 rounded-2xl" />
                    ))}
                  </div>
                ) : contractors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contractors.map(contractor => (
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
                              <span className="text-4xl font-bold text-primary">
                                {contractor.name.charAt(0)}
                              </span>
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
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span className="font-medium text-foreground">{contractor.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {t('search.reviews', { count: contractor.reviewCount || 0 })}
                            </span>
                          </div>
                          {contractor.location && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{contractor.location}</span>
                              {contractor.distance && (
                                <span className="text-primary font-medium shrink-0">({contractor.distance.toFixed(1)} km)</span>
                              )}
                            </div>
                          )}
                          {contractor.hourlyRate && (
                            <p className="text-lg font-semibold text-primary mb-4">
                              {t('search.hourly_rate', { rate: contractor.hourlyRate })}
                            </p>
                          )}
                          <Button 
                            className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl"
                            asChild
                          >
                            <Link to={`/contractor/${contractor.id}`}>{t('home.view_profile')}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <p className="text-muted-foreground text-lg mb-4">{t('search.no_results')}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ category: '', location: '', search: '', sort: 'rating', radius: 'any' })}
                      className="rounded-xl"
                    >
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