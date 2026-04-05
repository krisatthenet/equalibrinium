import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { getUserImageUrl } from '@/lib/userImage';
import {
  MapPin, Users, FileText, Search, X, Star,
  Clock, ChevronRight, Briefcase, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration.jsx';

/* ─── helpers ─── */
const statusColor = {
  Open: 'bg-green-500/10 text-green-500 border-green-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Completed: 'bg-muted text-muted-foreground border-border',
  Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

/* ═══════════════════════════════════════════════════════ */
const LocatorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'map';

  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Requests filters
  const [reqKeyword, setReqKeyword] = useState('');
  const [reqCategory, setReqCategory] = useState('all');
  const [reqStatus, setReqStatus] = useState('Open');

  // Contractors filters
  const [conKeyword, setConKeyword] = useState('');
  const [conCity, setConCity] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cats, contractorData, ticketData] = await Promise.all([
          pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false }),
          pb.collection('users').getFullList({
            filter: 'userType = "contractor"',
            sort: '-rating',
            expand: 'categories',
            $autoCancel: false
          }).catch(() => []),
          pb.collection('auction_tickets').getFullList({
            sort: '-created',
            expand: 'categoryId',
            $autoCancel: false
          }).catch(() => [])
        ]);
        setCategories(cats);
        setContractors(contractorData);
        setTickets(ticketData);
      } catch (err) {
        console.error('Explore fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const setTab = (tab) => setSearchParams({ tab });

  /* ── filtered requests ── */
  const filteredTickets = tickets.filter(t => {
    const kw = reqKeyword.toLowerCase();
    const matchKw = !kw || [
      t.description, t.location,
      t.expand?.categoryId?.name
    ].some(f => f?.toLowerCase().includes(kw));
    const matchCat = reqCategory === 'all' || t.categoryId === reqCategory;
    const matchStatus = reqStatus === 'all' || t.status === reqStatus;
    return matchKw && matchCat && matchStatus;
  });

  /* ── filtered contractors ── */
  const filteredContractors = contractors.filter(c => {
    const kw = conKeyword.toLowerCase();
    const city = conCity.toLowerCase();
    const matchKw = !kw || [
      c.name, c.profession, c.bio,
      ...(c.expand?.categories?.map(cat => cat.name) || [])
    ].some(f => f?.toLowerCase().includes(kw));
    const matchCity = !city || c.location?.toLowerCase().includes(city);
    return matchKw && matchCity;
  });

  /* ── map data: only open tickets ── */
  const openTickets = tickets.filter(t => t.status === 'Open');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Explore - WorkBee</title>
        <meta name="description" content="Explore open job requests and contractors near you." />
      </Helmet>

      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Explore</h1>
            <p className="text-muted-foreground mt-1">Browse the map, open requests, and available contractors.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setTab}>
            <TabsList className="mb-6 bg-card border border-border rounded-xl p-1 h-auto">
              <TabsTrigger value="map" className="flex items-center gap-2 px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapPin className="h-4 w-4" /> Map
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2 px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" /> Requests
                {!loading && openTickets.length > 0 && (
                  <span className="ml-1 flex items-center justify-center bg-primary text-black font-bold text-xs rounded-full w-5 h-5 leading-none">
                    {openTickets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="contractors" className="flex items-center gap-2 px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" /> Contractors
                {!loading && contractors.length > 0 && (
                  <span className="ml-1 flex items-center justify-center bg-primary text-black font-bold text-xs rounded-full w-5 h-5 leading-none">
                    {contractors.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── TAB 1: MAP ─── */}
            <TabsContent value="map" className="mt-0">
              {loading ? (
                <div className="w-full h-[600px] rounded-2xl bg-muted/30 flex items-center justify-center border border-border">
                  <div className="text-center">
                    <MapPin className="h-10 w-10 text-primary mx-auto mb-3 animate-bounce" />
                    <p className="text-muted-foreground font-medium">Loading map...</p>
                  </div>
                </div>
              ) : (
                <GoogleMapsIntegration
                  contractors={contractors}
                  tickets={openTickets}
                  categories={categories}
                />
              )}
            </TabsContent>

            {/* ─── TAB 2: REQUESTS ─── */}
            <TabsContent value="requests" className="mt-0">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search requests..."
                    value={reqKeyword}
                    onChange={e => setReqKeyword(e.target.value)}
                    className="pl-9 bg-input border-border rounded-xl h-11"
                  />
                </div>
                <Select value={reqCategory} onValueChange={setReqCategory}>
                  <SelectTrigger className="sm:w-48 bg-input border-border rounded-xl h-11">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reqStatus} onValueChange={setReqStatus}>
                  <SelectTrigger className="sm:w-40 bg-input border-border rounded-xl h-11">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {(reqKeyword || reqCategory !== 'all' || reqStatus !== 'Open') && (
                  <Button variant="outline" className="rounded-xl h-11 px-4 shrink-0"
                    onClick={() => { setReqKeyword(''); setReqCategory('all'); setReqStatus('Open'); }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                </div>
              ) : filteredTickets.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{filteredTickets.length} request{filteredTickets.length !== 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTickets.map(ticket => (
                      <Link key={ticket.id} to={`/auction-ticket/${ticket.id}`}>
                        <Card className="bg-card border-border hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl h-full">
                          <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="p-2 bg-primary/10 rounded-xl">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <Badge variant="outline" className={`text-xs shrink-0 ${statusColor[ticket.status] || ''}`}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                              {ticket.expand?.categoryId?.name || 'Service Request'}
                            </h3>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                                {ticket.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm mt-auto pt-3 border-t border-border">
                              {ticket.budget > 0 && (
                                <span className="font-semibold text-primary">€{ticket.budget}</span>
                              )}
                              {ticket.location && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />{ticket.location}
                                </span>
                              )}
                              <span className="text-muted-foreground flex items-center gap-1 ml-auto">
                                <Clock className="h-3 w-3" />
                                {new Date(ticket.created).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No requests found</p>
                </div>
              )}
            </TabsContent>

            {/* ─── TAB 3: CONTRACTORS ─── */}
            <TabsContent value="contractors" className="mt-0">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name, skill, or task..."
                    value={conKeyword}
                    onChange={e => setConKeyword(e.target.value)}
                    className="pl-9 bg-input border-border rounded-xl h-11"
                  />
                </div>
                <div className="relative sm:w-56">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="City or area..."
                    value={conCity}
                    onChange={e => setConCity(e.target.value)}
                    className="pl-9 bg-input border-border rounded-xl h-11"
                  />
                </div>
                {(conKeyword || conCity) && (
                  <Button variant="outline" className="rounded-xl h-11 px-4 shrink-0"
                    onClick={() => { setConKeyword(''); setConCity(''); }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
                </div>
              ) : filteredContractors.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredContractors.map(contractor => (
                      <Link key={contractor.id} to={`/contractor/${contractor.id}`}>
                        <Card className="bg-card border-border hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl h-full">
                          <CardContent className="p-5 flex flex-col h-full">
                            {/* Avatar */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-primary/10 shrink-0">
                                {getUserImageUrl(contractor) ? (
                                  <img
                                    src={getUserImageUrl(contractor, { thumb: '100x100' })}
                                    alt={contractor.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-xl font-bold text-primary">{contractor.name?.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{contractor.name}</p>
                                {contractor.profession && (
                                  <p className="text-xs text-primary truncate">{contractor.profession}</p>
                                )}
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-1.5 mb-3">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span className="font-medium text-sm text-foreground">{contractor.rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-xs text-muted-foreground">({contractor.reviewCount || 0})</span>
                              {contractor.isPromoted && (
                                <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">Top</Badge>
                              )}
                            </div>

                            {/* Location */}
                            {contractor.location && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{contractor.location}</span>
                              </div>
                            )}

                            {/* Categories */}
                            {contractor.expand?.categories?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {contractor.expand.categories.slice(0, 3).map(cat => (
                                  <Badge key={cat.id} variant="outline" className="text-xs bg-muted border-border">
                                    {cat.name}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                              {contractor.hourlyRate > 0 ? (
                                <span className="font-semibold text-primary text-sm">€{contractor.hourlyRate}/hr</span>
                              ) : (
                                <span />
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                View profile <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No contractors found</p>
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LocatorPage;
