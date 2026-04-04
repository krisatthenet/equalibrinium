import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { FileText, Clock, CheckCircle, Settings, MapPin, Star, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const StarRating = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`h-4 w-4 ${i <= value ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
    ))}
  </div>
);

const ContractorDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [openTickets, setOpenTickets] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contractorProfile, setContractorProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [finishingId, setFinishingId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchData = async () => {
    try {
      const [profileData, ticketsData, bidsData, reviewsData] = await Promise.all([
        pb.collection('contractors').getList(1, 1, {
          filter: `userId = "${currentUser.id}"`,
          $autoCancel: false
        }),
        pb.collection('auction_tickets').getList(1, 50, {
          filter: `status = "Open" && (isDirect = false || isDirect = null || assignedContractorId = "")`,
          sort: '-created',
          expand: 'categoryId',
          $autoCancel: false
        }),
        pb.collection('bids').getList(1, 50, {
          filter: `masterId = "${currentUser.id}"`,
          sort: '-created',
          expand: 'ticketId,ticketId.categoryId',
          $autoCancel: false
        }),
        pb.collection('reviews').getFullList({
          filter: `contractorId = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        }).catch(() => [])
      ]);

      setContractorProfile(profileData.items[0] || null);
      setOpenTickets(ticketsData.items);
      setMyBids(bidsData.items);
      setReviews(reviewsData);

      // Fetch direct requests assigned to this contractor
      const contractorRecord = profileData.items[0];
      if (contractorRecord) {
        const directData = await pb.collection('auction_tickets').getList(1, 50, {
          filter: `assignedContractorId = "${contractorRecord.id}" && status = "Open"`,
          sort: '-created',
          expand: 'categoryId',
          $autoCancel: false
        }).catch(() => ({ items: [] }));
        setDirectRequests(directData.items);
      }

      // Fetch fresh balance from user record
      const userRecord = await pb.collection('users').getOne(currentUser.id, { $autoCancel: false });
      setBalance(Number(userRecord.balance) || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const activeJobs = myBids.filter(b => b.status === 'accepted' && b.expand?.ticketId?.status !== 'Completed' && b.expand?.ticketId?.status !== 'Cancelled');
  const completedJobs = myBids.filter(b => b.status === 'accepted' && b.expand?.ticketId?.status === 'Completed');
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleMarkFinished = async (ticketId) => {
    setFinishingId(ticketId);
    try {
      await pb.collection('auction_tickets').update(ticketId, { status: 'Completed' }, { $autoCancel: false });
      toast({ title: t('auction.ticket_completed') });
      await fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Could not mark as finished.", variant: "destructive" });
    } finally {
      setFinishingId(null);
    }
  };

  const handleAcceptDirect = async (ticket) => {
    setAcceptingId(ticket.id);
    try {
      // Create an accepted bid for this ticket
      const bid = await pb.collection('bids').create({
        ticketId: ticket.id,
        masterId: currentUser.id,
        proposedRate: ticket.budget || 0,
        message: 'Direct request accepted',
        status: 'accepted',
      }, { $autoCancel: false });
      // Move ticket to In Progress
      await pb.collection('auction_tickets').update(ticket.id, {
        status: 'In Progress',
        acceptedBidId: bid.id,
      }, { $autoCancel: false });
      toast({ title: 'Request accepted', description: 'The ticket is now in progress.' });
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not accept the request.', variant: 'destructive' });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineDirect = async (ticket) => {
    try {
      await pb.collection('auction_tickets').update(ticket.id, {
        status: 'Cancelled',
      }, { $autoCancel: false });
      toast({ title: 'Request declined' });
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Could not decline the request.', variant: 'destructive' });
    }
  };

  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  const statCards = [
    {
      key: 'direct',
      label: 'Direct Requests',
      value: directRequests.length,
      icon: <Send className="h-6 w-6 text-rose-500" />,
      bg: 'bg-rose-500/10',
      ring: 'ring-rose-500/50',
    },
    {
      key: 'available',
      label: t('auction.available_requests'),
      value: openTickets.length,
      icon: <Clock className="h-6 w-6 text-yellow-500" />,
      bg: 'bg-yellow-500/10',
      ring: 'ring-yellow-500/50',
    },
    {
      key: 'active',
      label: t('dashboard.active_jobs'),
      value: activeJobs.length,
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/50',
    },
    {
      key: 'completed',
      label: t('dashboard.completed'),
      value: completedJobs.length,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      bg: 'bg-green-500/10',
      ring: 'ring-green-500/50',
    },
    {
      key: 'earnings',
      label: t('dashboard.total_earnings'),
      value: `€${balance.toFixed(2)}`,
      icon: <span className="text-xl font-bold text-primary leading-none">€</span>,
      bg: 'bg-primary/10',
      ring: 'ring-primary/50',
    },
  ];

  const renderActiveJobRow = (bid) => (
    <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">
              {bid.expand?.ticketId?.expand?.categoryId?.name || 'Service Request'}
            </h3>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              {bid.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bid.expand?.ticketId?.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="font-medium text-primary">€{bid.proposedRate}</span>
            {bid.expand?.ticketId?.location && (
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {bid.expand.ticketId.location}
              </span>
            )}
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(bid.created).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" variant="ghost" asChild className="rounded-lg">
            <Link to={`/auction-ticket/${bid.ticketId}`}>{t('auction.view_details')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBidRow = (bid) => (
    <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">
              {bid.expand?.ticketId?.expand?.categoryId?.name || 'Service Request'}
            </h3>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              {bid.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bid.expand?.ticketId?.description}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="font-medium text-primary">€{bid.proposedRate}</span>
            {bid.expand?.ticketId?.location && (
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {bid.expand.ticketId.location}
              </span>
            )}
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(bid.created).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button size="sm" variant="ghost" asChild className="rounded-lg shrink-0">
          <Link to={`/auction-ticket/${bid.ticketId}`}>{t('auction.view_details')}</Link>
        </Button>
      </div>
    </div>
  );

  const panels = {
    direct: {
      title: 'Direct Requests',
      icon: <Send className="h-5 w-5 text-rose-500" />,
      content: loading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : directRequests.length > 0 ? (
        <div className="space-y-4">
          {directRequests.map(ticket => (
            <div key={ticket.id} className="border border-rose-500/20 rounded-xl p-4 bg-rose-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{ticket.expand?.categoryId?.name || 'Service Request'}</h3>
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs">Direct</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {ticket.budget && <span className="font-medium text-primary">€{ticket.budget}</span>}
                    {ticket.location && (
                      <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {ticket.location}</span>
                    )}
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(ticket.created).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                    onClick={() => handleAcceptDirect(ticket)}
                    disabled={acceptingId === ticket.id}
                  >
                    {acceptingId === ticket.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeclineDirect(ticket)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No direct requests yet.</p>
        </div>
      ),
    },
    available: {
      title: t('auction.available_requests'),
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      content: loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : openTickets.length > 0 ? (
        <div className="space-y-4">
          {openTickets.map(ticket => (
            <div key={ticket.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{ticket.expand?.categoryId?.name || 'Service Request'}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {ticket.budget && <span className="font-medium text-primary">€{ticket.budget}</span>}
                    {ticket.location && (
                      <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {ticket.location}</span>
                    )}
                  </div>
                </div>
                <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shrink-0">
                  <Link to={`/auction-ticket/${ticket.id}`}>{t('auction.view_details')}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('auction.no_requests_available')}</p>
        </div>
      ),
    },
    active: {
      title: t('dashboard.active_jobs'),
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      content: loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : activeJobs.length > 0 ? (
        <div className="space-y-4">{activeJobs.map(renderActiveJobRow)}</div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('auction.no_bids_placed')}</p>
        </div>
      ),
    },
    completed: {
      title: t('dashboard.completed'),
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      content: completedJobs.length > 0 ? (
        <div className="space-y-4">{completedJobs.map(renderBidRow)}</div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('dashboard.completed')} — 0</p>
        </div>
      ),
    },
    earnings: {
      title: t('dashboard.total_earnings'),
      icon: <span className="text-lg font-bold text-primary leading-none">€</span>,
      content: completedJobs.length > 0 ? (
        <div className="space-y-4">
          {completedJobs.map(bid => (
            <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {bid.expand?.ticketId?.expand?.categoryId?.name || 'Service Request'}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bid.expand?.ticketId?.description}</p>
                  {bid.expand?.ticketId?.location && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {bid.expand.ticketId.location}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-primary">€{bid.proposedRate}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(bid.expand?.ticketId?.updated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t border-border">
            <p className="text-lg font-bold text-foreground">{t('dashboard.total_earnings')}: <span className="text-primary">€{balance.toFixed(2)}</span></p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-5xl font-bold text-muted-foreground block text-center mb-3">€</span>
          <p className="text-muted-foreground">{t('dashboard.total_earnings')} — €{balance.toFixed(2)}</p>
        </div>
      ),
    },
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.contractor_title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">{t('dashboard.contractor_title')}</h1>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <Button variant="outline" asChild className="w-fit border-border hover:bg-muted rounded-xl">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('header.settings')}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {statCards.map(card => (
                <Card
                  key={card.key}
                  className={`bg-card border-border rounded-2xl cursor-pointer transition-all hover:bg-muted/30 ${activePanel === card.key ? `ring-2 ${card.ring}` : ''}`}
                  onClick={() => togglePanel(card.key)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                        <p className="text-3xl font-bold text-foreground">{card.value}</p>
                      </div>
                      <div className={`p-3 ${card.bg} rounded-xl`}>{card.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {activePanel && panels[activePanel] && (
              <Card className="bg-card border-border rounded-2xl mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {panels[activePanel].icon}
                    {panels[activePanel].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {panels[activePanel].content}
                </CardContent>
              </Card>
            )}

            {/* Reviews & Rating section */}
            <Card className="bg-card border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  {t('dashboard.rating')} & {t('profile.reviews_title', { count: reviews.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : reviews.length > 0 ? (
                  <>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-xl">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-foreground">{avgRating}</p>
                        <StarRating value={Math.round(Number(avgRating))} />
                        <p className="text-xs text-muted-foreground mt-1">{reviews.length} {t('dashboard.reviews').toLowerCase()}</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = reviews.filter(r => r.rating === star).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground w-3">{star}</span>
                              <Star className="h-3 w-3 text-primary fill-primary shrink-0" />
                              <div className="flex-1 bg-muted rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-muted-foreground w-4 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <StarRating value={review.rating} />
                            <span className="text-xs text-muted-foreground">{new Date(review.created).toLocaleDateString()}</span>
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('profile.no_reviews')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ContractorDashboard;
