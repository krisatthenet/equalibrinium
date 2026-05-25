import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { FileText, Clock, CheckCircle, Settings, MapPin, Star, Loader2, Send, Eye, TrendingUp, Trophy, CalendarDays, Navigation, MessageCircle, Zap, ShieldCheck, ArrowUpRight, Images, Plus } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import ConversationsInbox from '@/components/ConversationsInbox.jsx';

const deg2rad = d => d * (Math.PI / 180);
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PlanBadge from '@/components/PlanBadge.jsx';
import { PLANS, getEffectivePlan, formatLimit } from '@/lib/plans';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ContractorAvailability from '@/components/ContractorAvailability.jsx';
import PortfolioManager from '@/components/PortfolioManager.jsx';

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
  const [searchParams] = useSearchParams();
  const [openTickets, setOpenTickets] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [ticketsMap, setTicketsMap] = useState({});
  const [reviews, setReviews] = useState([]);
  const [contractorProfile, setContractorProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [finishingId, setFinishingId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [searchRank, setSearchRank] = useState(null);
  const [totalContractors, setTotalContractors] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const { permission, requestPermission } = usePushNotifications(currentUser?.id);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsData, bidsData, reviewsData] = await Promise.all([
        pb.collection('auction_tickets').getList(1, 50, {
          filter: `status = "Open" && isDirect != true`,
          sort: '-created',
          expand: 'categoryId',
          $autoCancel: false
        }),
        pb.collection('bids').getList(1, 50, {
          filter: `masterId = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('reviews').getFullList({
          filter: `contractorId = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        }).catch(() => [])
      ]);

      setOpenTickets(ticketsData.items);
      setMyBids(bidsData.items);
      setReviews(reviewsData);

      // Fetch ticket records for all bids (ticketId is a plain text field, expand doesn't work)
      const bidTicketIds = [...new Set(bidsData.items.map(b => b.ticketId).filter(Boolean))];
      if (bidTicketIds.length > 0) {
        const filter = bidTicketIds.map(id => `id = "${id}"`).join(' || ');
        const ticketRecords = await pb.collection('auction_tickets').getFullList({
          filter,
          expand: 'categoryId',
          $autoCancel: false
        }).catch(() => []);
        const map = {};
        ticketRecords.forEach(t => { map[t.id] = t; });
        setTicketsMap(map);
      }

      // Fetch direct requests assigned to this contractor (assignedContractorId now stores user ID)
      const directData = await pb.collection('auction_tickets').getList(1, 50, {
        filter: `assignedContractorId = "${currentUser.id}" && status = "Open"`,
        sort: '-created',
        expand: 'categoryId',
        $autoCancel: false
      }).catch(() => ({ items: [] }));
      setDirectRequests(directData.items);

      // Fetch fresh balance and profile views
      const userRecord = await pb.collection('users').getOne(currentUser.id, { $autoCancel: false });
      setBalance(Number(userRecord.balance) || 0);
      setContractorProfile(userRecord);

      // Compute search rank among all contractors
      const allContractors = await pb.collection('users').getFullList({
        filter: `userType = "contractor" || userType = "master"`,
        fields: 'id,rating,reviewCount',
        $autoCancel: false,
      }).catch(() => []);

      const sorted = [...allContractors].sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      });
      const rank = sorted.findIndex(c => c.id === currentUser.id) + 1;
      setSearchRank(rank || null);
      setTotalContractors(allContractors.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const activeJobs = myBids.filter(b => b.status === 'accepted' && ticketsMap[b.ticketId]?.status !== 'Completed' && ticketsMap[b.ticketId]?.status !== 'Cancelled');
  const completedJobs = myBids.filter(b => b.status === 'accepted' && ticketsMap[b.ticketId]?.status === 'Completed');
  const pendingBids = myBids.filter(b => b.status === 'pending');

  const getBidTimeRemaining = (bid) => {
    if (!bid.expiresAt) return null;
    const ms = new Date(bid.expiresAt) - now;
    if (ms <= 0) return 'Pasiūlymas baigėsi';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}min`;
  };
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const nearbyTickets = useMemo(() => {
    if (!contractorProfile?.latitude || !contractorProfile?.longitude) return [];
    const lat = Number(contractorProfile.latitude);
    const lng = Number(contractorProfile.longitude);
    return openTickets
      .filter(t => t.latitude && t.longitude)
      .map(t => ({ ...t, _dist: haversine(lat, lng, Number(t.latitude), Number(t.longitude)) }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 10);
  }, [contractorProfile, openTickets]);

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

  useEffect(() => {
    if (searchParams.get('tab') === 'messages') setActivePanel('messages');
    if (searchParams.get('subscription') === 'success') {
      toast({ title: 'Plan activated!', description: 'Your Pro plan is now live.' });
      fetchData();
    }
  }, [searchParams]);

  const handleUpgrade = async (plan) => {
    setSubLoading(true);
    try {
      const resp = await apiServerClient.fetch('/stripe/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cycle: 'monthly', successPath: '/dashboard/contractor?subscription=success' }),
      });
      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: 'Error', description: data.error || 'Could not start checkout.', variant: 'destructive' });
    } catch {
      toast({ title: 'Error', description: 'Could not connect to payment service.', variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  };

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
      key: 'pending',
      label: 'Mano pasiūlymai',
      value: pendingBids.length,
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      bg: 'bg-orange-500/10',
      ring: 'ring-orange-500/50',
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
  ];

  const renderActiveJobRow = (bid) => {
    const ticket = ticketsMap[bid.ticketId];
    return (
      <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">
                {ticket?.expand?.categoryId?.name || t('auction.service_request')}
              </h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {bid.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket?.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium text-primary">€{bid.proposedRate}</span>
              {ticket?.location && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ticket.location}
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
  };

  const renderBidRow = (bid) => {
    const ticket = ticketsMap[bid.ticketId];
    return (
      <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">
                {ticket?.expand?.categoryId?.name || t('auction.service_request')}
              </h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {bid.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket?.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-medium text-primary">€{bid.proposedRate}</span>
              {ticket?.location && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ticket.location}
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
  };

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
                    <h3 className="font-semibold text-foreground">{ticket.expand?.categoryId?.name || t('auction.service_request')}</h3>
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
                  <h3 className="font-semibold text-foreground mb-1">{ticket.expand?.categoryId?.name || t('auction.service_request')}</h3>
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
    pending: {
      title: 'Mano pasiūlymai',
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      content: loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : pendingBids.length > 0 ? (
        <div className="space-y-4">
          {pendingBids.map(bid => {
            const ticket = ticketsMap[bid.ticketId];
            const timeLeft = getBidTimeRemaining(bid);
            const isExpiringSoon = bid.expiresAt && (new Date(bid.expiresAt) - Date.now()) < 6 * 3600000;
            return (
              <div key={bid.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {ticket?.expand?.categoryId?.name || t('auction.service_request')}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket?.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="font-medium text-primary">€{bid.proposedRate}</span>
                      {ticket?.location && (
                        <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ticket.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Laukiama</Badge>
                      {timeLeft && (
                        <span className={`text-xs flex items-center gap-1 ${isExpiringSoon ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          <Clock className="h-3 w-3" />{timeLeft}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nėra aktyvių pasiūlymų.</p>
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
    messages: {
      title: 'Messages',
      icon: <MessageCircle className="h-5 w-5 text-primary" />,
      content: <ConversationsInbox />,
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
            {permission === 'default' && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Įjunk pranešimus — gauk žinutę kai atsiranda naujas darbas.</p>
                <Button size="sm" onClick={requestPermission}>Įjungti</Button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{t('dashboard.contractor_title')}</h1>
                  {currentUser?.title && <Badge variant="secondary">{currentUser.title}</Badge>}
                  <PlanBadge plan={currentUser?.plan} />
                </div>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <Button variant="outline" asChild className="w-fit border-border hover:bg-muted rounded-xl">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('header.settings')}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
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

            {/* Pro plan promo / status card */}
            {(() => {
              const plan = getEffectivePlan(currentUser);
              const isPro = plan !== 'standard';
              const limits = PLANS[plan]?.contractor ?? PLANS.standard.contractor;

              if (isPro) {
                return (
                  <Card className="rounded-2xl mb-6 border-primary/30 bg-primary/5">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="shrink-0 p-3 rounded-xl bg-primary/20">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground">Pro features active</p>
                          <PlanBadge plan={plan} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Priority listing · Verified Pro badge · {formatLimit(limits.bidsPerMonth)} bids/month
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 rounded-xl" asChild>
                        <Link to="/settings?tab=plan">Manage plan</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              }

              // Free tier — show 3-column Pro pitch
              const proFeatures = [
                { icon: <Eye className="h-4 w-4 text-primary" />, label: 'More bids', desc: `Up to 15/month vs 5 free` },
                { icon: <TrendingUp className="h-4 w-4 text-primary" />, label: 'Priority listing', desc: 'Appear above free contractors' },
                { icon: <ShieldCheck className="h-4 w-4 text-primary" />, label: 'Pro badge', desc: 'Stand out to clients' },
              ];
              return (
                <Card className="rounded-2xl mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <p className="font-semibold text-foreground">Go Pro — from €9/month</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade('vip')}
                        disabled={subLoading}
                        className="shrink-0 rounded-xl"
                      >
                        {subLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />}
                        Upgrade
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {proFeatures.map(f => (
                        <div key={f.label} className="flex flex-col items-center text-center p-3 rounded-xl bg-background/60 border border-border/50">
                          <div className="p-2 rounded-lg bg-primary/10 mb-2">{f.icon}</div>
                          <p className="text-xs font-semibold text-foreground">{f.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center mt-3">
                      Cancel anytime · <Link to="/settings?tab=plan" className="underline underline-offset-2">See all plans</Link>
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Portfolio section */}
            <Card className="bg-card border-border rounded-2xl mb-6">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5 text-primary" />
                  Portfolio
                </CardTitle>
                <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => setPortfolioOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add project
                </Button>
              </CardHeader>
              <CardContent>
                <PortfolioManager
                  contractorId={currentUser?.id}
                  dialogOpen={portfolioOpen}
                  onDialogOpenChange={setPortfolioOpen}
                />
              </CardContent>
            </Card>

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

            {/* Availability section */}
            <Card className="bg-card border-border rounded-2xl mb-8">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Availability Calendar
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={() => setShowAvailability(v => !v)}
                >
                  {showAvailability ? 'Collapse' : 'Manage'}
                </Button>
              </CardHeader>
              {showAvailability && (
                <CardContent>
                  <ContractorAvailability contractorId={currentUser?.id} />
                </CardContent>
              )}
              {!showAvailability && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Mark the days you're available so clients can request a specific slot — no more "when are you free?" messages.
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Insights section */}
            <Card className="bg-card border-border rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Profile Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Profile views */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Eye className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '—' : (contractorProfile?.profileViews || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Profile Views</p>
                    </div>
                  </div>

                  {/* Bid win rate */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '—' : myBids.length === 0 ? '0%' : `${Math.round((myBids.filter(b => b.status === 'accepted').length / myBids.length) * 100)}%`}
                      </p>
                      <p className="text-sm text-muted-foreground">Bid Win Rate</p>
                    </div>
                  </div>

                  {/* Search rank */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {loading || searchRank === null ? '—' : `#${searchRank}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {totalContractors ? `Search Rank of ${totalContractors}` : 'Search Rank'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upgrade nudge for lower-ranked contractors */}
                {searchRank && totalContractors && searchRank > Math.ceil(totalContractors * 0.3) && (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Upgrade to a paid plan to boost your ranking and appear higher in search results.
                    </p>
                    <Button size="sm" asChild className="shrink-0">
                      <a href="/settings?tab=payment">Upgrade</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nearby Jobs section */}
            <Card className="bg-card border-border rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Nearby Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : !contractorProfile?.latitude ? (
                  <div className="text-center py-8">
                    <Navigation className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">Add your location in Settings to see jobs near you.</p>
                    <Button variant="outline" asChild className="rounded-xl">
                      <Link to="/settings">Update Location</Link>
                    </Button>
                  </div>
                ) : nearbyTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Navigation className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No open jobs nearby with coordinates yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nearbyTickets.map(ticket => (
                      <div key={ticket.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground">{ticket.expand?.categoryId?.name || t('auction.service_request')}</h3>
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Navigation className="h-3 w-3 mr-1" />
                                {ticket._dist < 1 ? `${Math.round(ticket._dist * 1000)} m` : `${ticket._dist.toFixed(1)} km`}
                              </Badge>
                            </div>
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
                )}
              </CardContent>
            </Card>

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
