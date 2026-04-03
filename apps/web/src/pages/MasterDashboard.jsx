import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { FileText, Clock, CheckCircle, DollarSign, Settings, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const MasterDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [openTickets, setOpenTickets] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [masterProfile, setMasterProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, ticketsData, bidsData] = await Promise.all([
          pb.collection('masters').getList(1, 1, {
            filter: `userId = "${currentUser.id}"`,
            $autoCancel: false
          }),
          pb.collection('auction_tickets').getList(1, 50, {
            filter: `status = "Open"`,
            sort: '-created',
            expand: 'categoryId',
            $autoCancel: false
          }),
          pb.collection('bids').getList(1, 50, {
            filter: `masterId = "${currentUser.id}"`,
            sort: '-created',
            expand: 'ticketId,ticketId.categoryId',
            $autoCancel: false
          })
        ]);

        const profile = profileData.items[0] || null;
        setMasterProfile(profile);

        // Calculate distances for open tickets
        const ticketsWithDistance = ticketsData.items.map(ticket => {
          if (profile && profile.latitude && profile.longitude && ticket.latitude && ticket.longitude) {
            ticket.distance = calculateDistance(profile.latitude, profile.longitude, ticket.latitude, ticket.longitude);
          }
          return ticket;
        });

        setOpenTickets(ticketsWithDistance);
        setMyBids(bidsData.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const activeJobs = myBids.filter(b => b.status === 'accepted' && b.expand?.ticketId?.status === 'In Progress');
  const completedJobs = myBids.filter(b => b.status === 'accepted' && b.expand?.ticketId?.status === 'Completed');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.expand?.ticketId?.budget || 0), 0);

  return (
    <>
      <Helmet>
        <title>{t('dashboard.master_title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">{t('dashboard.master_title')}</h1>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <Button variant="outline" asChild className="w-fit border-border hover:bg-muted">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('header.settings')}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('auction.available_requests')}</p>
                      <p className="text-3xl font-bold text-foreground">{openTickets.length}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.active_jobs')}</p>
                      <p className="text-3xl font-bold text-foreground">{activeJobs.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.completed')}</p>
                      <p className="text-3xl font-bold text-foreground">{completedJobs.length}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.total_earnings')}</p>
                      <p className="text-3xl font-bold text-foreground">€{totalEarnings}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>{t('auction.available_requests')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : openTickets.length > 0 ? (
                    <div className="space-y-4">
                      {openTickets.map(ticket => (
                        <div key={ticket.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {ticket.expand?.categoryId?.name || 'Service Request'}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ticket.description}</p>
                              <div className="flex flex-wrap gap-3 text-sm">
                                {ticket.budget && (
                                  <span className="font-medium text-primary">€{ticket.budget}</span>
                                )}
                                {ticket.location && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/> {ticket.location}
                                  </span>
                                )}
                                {ticket.distance !== undefined && ticket.distance !== null && (
                                  <span className="text-muted-foreground">
                                    {ticket.distance.toFixed(1)} km away
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                              <Link to={`/auction-ticket/${ticket.id}`}>{t('auction.view_details')}</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{t('auction.no_requests_available')}</h3>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>{t('auction.my_bids')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : myBids.length > 0 ? (
                    <div className="space-y-4">
                      {myBids.map(bid => (
                        <div key={bid.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors duration-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">
                                  {bid.expand?.ticketId?.expand?.categoryId?.name || 'Service Request'}
                                </h3>
                                <Badge variant="outline" className={
                                  bid.status === 'accepted' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  bid.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }>
                                  {bid.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">Proposed: €{bid.proposedRate}</p>
                            </div>
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/auction-ticket/${bid.ticketId}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{t('auction.no_bids_placed')}</h3>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MasterDashboard;