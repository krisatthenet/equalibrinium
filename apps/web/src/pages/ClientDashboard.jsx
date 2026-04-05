import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { getUserImageUrl } from '@/lib/userImage';
import { FileText, Clock, CheckCircle, Plus, Settings, MapPin, CreditCard, Star, User, Loader2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AuctionTicketForm from '@/components/AuctionTicketForm.jsx';
import ReviewModal from '@/components/ReviewModal.jsx';

const statusClass = (status) => {
  if (status === 'Open') return 'bg-yellow-500/10 text-yellow-500';
  if (status === 'In Progress') return 'bg-blue-500/10 text-blue-500';
  if (status === 'Completed') return 'bg-green-500/10 text-green-500';
  return 'bg-red-500/10 text-red-500';
};

const ClientDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [acceptedBids, setAcceptedBids] = useState({}); // ticketId -> bid
  const [contractors, setContractors] = useState({}); // masterId -> user
  const [existingReviews, setExistingReviews] = useState({}); // ticketId -> true
  const [paidTickets, setPaidTickets] = useState({}); // ticketId -> payment record
  const [pendingBidCounts, setPendingBidCounts] = useState({}); // ticketId -> count
  const [categoriesMap, setCategoriesMap] = useState({}); // categoryId -> name
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { contractorId, contractorName, ticketId }
  const [markingDoneId, setMarkingDoneId] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      const records = await pb.collection('auction_tickets').getFullList({
        filter: `clientId = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setTickets(records);

      // Fetch category names (categoryId is a plain text field, not a relation)
      const catIds = [...new Set(records.map(r => r.categoryId).filter(Boolean))];
      if (catIds.length > 0) {
        const cats = await pb.collection('categories').getFullList({
          filter: catIds.map(id => `id = "${id}"`).join(' || '),
          $autoCancel: false
        }).catch(() => []);
        const map = {};
        cats.forEach(c => { map[c.id] = c.name; });
        setCategoriesMap(map);
      }

      // Fetch accepted bids for all tickets
      const ids = records.map(r => r.id);
      if (ids.length > 0) {
        const filter = ids.map(id => `ticketId = "${id}"`).join(' || ');
        const bids = await pb.collection('bids').getFullList({
          filter: `(${filter}) && status = "accepted"`,
          $autoCancel: false
        }).catch(() => []);

        // Fetch pending bids count per ticket
        const allBids = await pb.collection('bids').getFullList({
          filter: `(${filter}) && status = "pending"`,
          $autoCancel: false
        }).catch(() => []);
        const countsMap = {};
        allBids.forEach(b => { countsMap[b.ticketId] = (countsMap[b.ticketId] || 0) + 1; });
        setPendingBidCounts(countsMap);

        const bidsMap = {};
        bids.forEach(b => { bidsMap[b.ticketId] = b; });
        setAcceptedBids(bidsMap);

        // Fetch contractor user records (masterId is a plain text field, not a relation)
        const masterIds = [...new Set(bids.map(b => b.masterId).filter(Boolean))];
        if (masterIds.length > 0) {
          const contractorUsers = await pb.collection('users').getFullList({
            filter: masterIds.map(id => `id = "${id}"`).join(' || '),
            $autoCancel: false
          }).catch(() => []);
          const contractorsMap = {};
          contractorUsers.forEach(u => { contractorsMap[u.id] = u; });
          setContractors(contractorsMap);
        }

        // Fetch existing reviews by this client
        const reviews = await pb.collection('reviews').getFullList({
          filter: `clientId = "${currentUser.id}"`,
          $autoCancel: false
        }).catch(() => []);
        const reviewsMap = {};
        reviews.forEach(r => { if (r.ticketId) reviewsMap[r.ticketId] = true; });
        setExistingReviews(reviewsMap);

        // Fetch completed payments for this user's tickets
        const payments = await pb.collection('payments').getFullList({
          filter: `userId = "${currentUser.id}" && status = "completed"`,
          $autoCancel: false
        }).catch(() => []);
        const paidMap = {};
        payments.forEach(p => { if (p.ticketId) paidMap[p.ticketId] = p; });
        setPaidTickets(paidMap);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchTickets();
  }, [currentUser]);

  const allTickets = tickets;
  const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const completedTickets = tickets.filter(t => t.status === 'Completed');

  const handleMarkDone = async (ticketId) => {
    setMarkingDoneId(ticketId);
    try {
      await pb.collection('auction_tickets').update(ticketId, { status: 'Completed' }, { $autoCancel: false });
      await fetchTickets();
    } catch {
      // silently refetch on error
    } finally {
      setMarkingDoneId(null);
    }
  };

  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  const statCards = [
    {
      key: 'all',
      label: t('dashboard.your_requests'),
      value: allTickets.length,
      icon: <FileText className="h-6 w-6 text-primary" />,
      bg: 'bg-primary/10',
      ring: 'ring-primary/50',
    },
    {
      key: 'active',
      label: t('dashboard.active_requests'),
      value: activeTickets.length,
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/50',
    },
    {
      key: 'completed',
      label: t('dashboard.completed'),
      value: completedTickets.length,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      bg: 'bg-green-500/10',
      ring: 'ring-green-500/50',
    },
  ];

  const getCategoryName = (ticket) => {
    const raw = categoriesMap[ticket.categoryId];
    return raw ? t(`professions.${raw}`, { defaultValue: raw }) : t('auction.service_request');
  };

  const renderTicketRow = (ticket, isCompleted = false) => {
    const bid = acceptedBids[ticket.id];
    const contractor = bid?.masterId ? contractors[bid.masterId] : null;
    const alreadyReviewed = existingReviews[ticket.id];
    const payment = paidTickets[ticket.id];
    const avatarUrl = getUserImageUrl(contractor, { thumb: '100x100' });
    const pendingBids = pendingBidCounts[ticket.id] || 0;

    // Paid & completed — compact historical note, no action buttons
    if (isCompleted && payment) {
      return (
        <div key={ticket.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-muted/20 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-foreground">
              {getCategoryName(ticket)}
            </span>
            {contractor && (
              <span className="text-muted-foreground"> · {contractor.name}</span>
            )}
          </div>
          <span className="text-green-600 font-semibold shrink-0">€{Number(payment.amount).toFixed(2)} paid</span>
          <span className="text-muted-foreground shrink-0">{new Date(ticket.created).toLocaleDateString()}</span>
          {alreadyReviewed && (
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Star className="h-3 w-3 text-primary fill-primary" /> Reviewed
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={ticket.id} className="border border-border rounded-xl p-5 hover:bg-muted/30 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg text-foreground">
                {getCategoryName(ticket)}
              </h3>
              <Badge className={statusClass(ticket.status)}>
                {t(`auction.${ticket.status.toLowerCase().replace(' ', '_')}`, { defaultValue: ticket.status })}
              </Badge>
              {pendingBids > 0 && (
                <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="flex items-center justify-center bg-primary text-black font-bold text-xs rounded-full w-4 h-4 leading-none">{pendingBids}</span>
                  new bid{pendingBids !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              {ticket.location && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {ticket.location}
                </span>
              )}
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {new Date(ticket.created).toLocaleDateString()}
              </span>
            </div>

            {/* Contractor info for completed unpaid tickets */}
            {isCompleted && contractor && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={contractor.name} className="w-full h-full object-cover" />
                    : <User className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{contractor.name || 'Contractor'}</p>
                  <p className="text-xs text-primary font-semibold">€{bid.proposedRate} agreed</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
              <Link to={`/auction-ticket/${ticket.id}`}>{t('auction.view_details')}</Link>
            </Button>
            {ticket.status === 'Open' && (
              <Button
                variant="outline"
                className="rounded-xl border-border"
                onClick={() => setEditingTicket(ticket)}
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
            {ticket.status === 'In Progress' && bid && (
              <Button
                onClick={() => handleMarkDone(ticket.id)}
                disabled={markingDoneId === ticket.id}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                {markingDoneId === ticket.id
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <CheckCircle className="h-4 w-4 mr-2" />}
                Mark as Done
              </Button>
            )}
            {isCompleted && bid?.proposedRate && (
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                <Link to={`/auction-ticket/${ticket.id}/payment`}>
                  <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                </Link>
              </Button>
            )}
            {isCompleted && contractor && !alreadyReviewed && (
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 rounded-xl"
                onClick={() => setReviewTarget({ contractorId: contractor.id, contractorName: contractor.name, ticketId: ticket.id })}
              >
                <Star className="h-4 w-4 mr-2" /> Leave a Review
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const panels = {
    all: {
      title: t('dashboard.your_requests'),
      icon: <FileText className="h-5 w-5 text-primary" />,
      content: loading
        ? <SkeletonList />
        : allTickets.length > 0
          ? <div className="space-y-4">{allTickets.map(t => renderTicketRow(t, t.status === 'Completed'))}</div>
          : <EmptyState onNew={() => setIsCreateModalOpen(true)} t={t} />,
    },
    active: {
      title: t('dashboard.active_requests'),
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      content: loading
        ? <SkeletonList />
        : activeTickets.length > 0
          ? <div className="space-y-4">{activeTickets.map(t => renderTicketRow(t))}</div>
          : <EmptyState onNew={() => setIsCreateModalOpen(true)} t={t} />,
    },
    completed: {
      title: t('dashboard.completed'),
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      content: completedTickets.length > 0
        ? <div className="space-y-4">{completedTickets.map(t => renderTicketRow(t, true))}</div>
        : (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('dashboard.completed')} — 0</p>
          </div>
        ),
    },
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.client_title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">{t('dashboard.client_title')}</h1>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <div className="flex gap-3">
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('auction.create_new_request')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader className="shrink-0">
                      <DialogTitle>{t('auction.create_new_request')}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 pr-1">
                      <AuctionTicketForm
                        onSuccess={() => { setIsCreateModalOpen(false); fetchTickets(); }}
                        onCancel={() => setIsCreateModalOpen(false)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" asChild className="border-border hover:bg-muted rounded-xl">
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('header.settings')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <CardContent>{panels[activePanel].content}</CardContent>
              </Card>
            )}

            {!activePanel && (
              <Card className="bg-card border-border rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('dashboard.your_requests')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <SkeletonList /> : tickets.length > 0 ? (
                    <div className="space-y-4">
                      {tickets.map(ticket => renderTicketRow(ticket, ticket.status === 'Completed'))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">{t('dashboard.no_requests')}</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('dashboard.start_browsing')}</p>
                      <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('auction.create_new_request')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Edit ticket modal */}
      <Dialog open={!!editingTicket} onOpenChange={(open) => { if (!open) setEditingTicket(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl flex flex-col max-h-[90vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            {editingTicket && (
              <AuctionTicketForm
                ticketId={editingTicket.id}
                initialData={editingTicket}
                onSuccess={() => { setEditingTicket(null); fetchTickets(); }}
                onCancel={() => setEditingTicket(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review modal */}
      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        contractorId={reviewTarget?.contractorId}
        contractorName={reviewTarget?.contractorName}
        ticketId={reviewTarget?.ticketId}
        onSubmitted={() => { setReviewTarget(null); fetchTickets(); }}
      />
    </>
  );
};

const SkeletonList = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
  </div>
);

const EmptyState = ({ onNew, t }) => (
  <div className="text-center py-12">
    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
    <p className="text-muted-foreground mb-4">{t('dashboard.no_requests')}</p>
    <Button onClick={onNew} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
      <Plus className="h-4 w-4 mr-2" />
      {t('auction.create_new_request')}
    </Button>
  </div>
);

export default ClientDashboard;
