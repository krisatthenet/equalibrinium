import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, DollarSign, FileText, CheckCircle, XCircle, User, Star, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import BidForm from '@/components/BidForm.jsx';

const AuctionTicketDetailsPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const ticketData = await pb.collection('auction_tickets').getOne(id, {
        expand: 'categoryId,clientId',
        $autoCancel: false
      });
      setTicket(ticketData);

      const bidsData = await pb.collection('bids').getFullList({
        filter: `ticketId = "${id}"`,
        expand: 'masterId',
        sort: 'proposedRate',
        $autoCancel: false
      });
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({ title: "Error", description: "Could not load ticket details.", variant: "destructive" });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAcceptBid = async (bidId) => {
    try {
      await pb.collection('auction_tickets').update(id, {
        status: 'In Progress',
        acceptedBidId: bidId
      }, { $autoCancel: false });

      await pb.collection('bids').update(bidId, {
        status: 'accepted'
      }, { $autoCancel: false });

      const otherBids = bids.filter(b => b.id !== bidId);
      for (const b of otherBids) {
        await pb.collection('bids').update(b.id, { status: 'rejected' }, { $autoCancel: false });
      }

      toast({ title: "Success", description: t('auction.bid_accepted') });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Could not accept bid.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 py-12 max-w-5xl mx-auto w-full px-4">
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ticket) return null;

  const isClient = currentUser?.id === ticket.clientId;
  const isContractor = currentUser?.userType === 'master' || currentUser?.userType === 'contractor';
  const myBid = isContractor ? bids.find(b => b.masterId === currentUser.id) : null;

  const images = ticket.files?.filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i)) || [];
  const pdfs = ticket.files?.filter(f => f.match(/\.pdf$/i)) || [];

  return (
    <>
      <Helmet>
        <title>{ticket.expand?.categoryId?.name || 'Ticket'} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {ticket.expand?.categoryId?.name || 'Service Request'}
                  </h1>
                  <Badge className={
                    ticket.status === 'Open' ? 'bg-yellow-500/10 text-yellow-500 border-none' :
                    ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-none' :
                    ticket.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-none' :
                    'bg-red-500/10 text-red-500 border-none'
                  }>
                    {t(`auction.${ticket.status.toLowerCase().replace(' ', '_')}`, { defaultValue: ticket.status })}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Posted on {new Date(ticket.created).toLocaleDateString()}
                </p>
              </div>

              {isContractor && ticket.status === 'Open' && !myBid && (
                <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                      {t('auction.place_bid')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('auction.place_bid')}</DialogTitle>
                    </DialogHeader>
                    <BidForm 
                      ticketId={ticket.id} 
                      onSuccess={() => { setIsBidModalOpen(false); fetchData(); }} 
                      onCancel={() => setIsBidModalOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('auction.description')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {ticket.description || 'No description provided.'}
                    </p>
                  </CardContent>
                </Card>

                {ticket.files && ticket.files.length > 0 && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle>{t('upload.attachments', { defaultValue: 'Attachments' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                          {images.map((img, i) => (
                            <a 
                              key={i} 
                              href={pb.files.getUrl(ticket, img)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block aspect-square rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity bg-muted"
                            >
                              <img src={pb.files.getUrl(ticket, img)} alt={`Attachment ${i+1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {pdfs.length > 0 && (
                        <div className="space-y-3">
                          {pdfs.map((pdf, i) => (
                            <a 
                              key={i} 
                              href={pb.files.getUrl(ticket, pdf)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                  <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground truncate">{pdf}</span>
                              </div>
                              <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 ml-4" />
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {isClient && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle>Bids Received ({bids.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bids.length > 0 ? (
                        <div className="space-y-4">
                          {bids.map(bid => (
                            <div key={bid.id} className={`border rounded-xl p-5 ${bid.status === 'accepted' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    {bid.expand?.masterId?.avatar ? (
                                      <img src={pb.files.getUrl(bid.expand.masterId, bid.expand.masterId.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="h-6 w-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{bid.expand?.masterId?.name || 'Contractor'}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                                      <span>{bid.expand?.masterId?.rating || '0.0'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xl text-primary">€{bid.proposedRate}</p>
                                  <Badge variant="outline" className="mt-1 border-border">{bid.status}</Badge>
                                </div>
                              </div>
                              {bid.message && (
                                <p className="text-sm text-muted-foreground mb-4 bg-background border border-border p-4 rounded-lg">
                                  "{bid.message}"
                                </p>
                              )}
                              {ticket.status === 'Open' && bid.status === 'pending' && (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" onClick={() => handleAcceptBid(bid.id)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                                    {t('auction.accept_bid')}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">{t('auction.no_bids_placed')}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {isContractor && myBid && (
                  <Card className="bg-card border-border border-primary/50 rounded-2xl">
                    <CardHeader>
                      <CardTitle>{t('auction.my_bids')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-2xl text-primary">€{myBid.proposedRate}</p>
                          <Badge variant="outline" className="mt-2 border-border">{myBid.status}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{new Date(myBid.created).toLocaleDateString()}</span>
                      </div>
                      {myBid.message && (
                        <p className="text-sm text-muted-foreground mt-4 bg-background border border-border p-4 rounded-lg">"{myBid.message}"</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <MapPin className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{ticket.location || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <DollarSign className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Budget</p>
                        <p className="text-sm text-muted-foreground">{ticket.budget ? `€${ticket.budget}` : 'Open to offers'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <Clock className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Duration</p>
                        <p className="text-sm text-muted-foreground">{ticket.durationEstimate || 'Not specified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {ticket.latitude && ticket.longitude && (
                  <Card className="bg-card border-border overflow-hidden rounded-2xl">
                    <div className="aspect-video bg-muted relative">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAz3m8MF5oif2DmLltfypmhqKX4ey39spo&q=${ticket.latitude},${ticket.longitude}`}
                        allowFullScreen
                        title="Ticket Location"
                      ></iframe>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AuctionTicketDetailsPage;