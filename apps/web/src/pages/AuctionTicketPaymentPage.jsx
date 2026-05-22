import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, AlertCircle, Loader2, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const AuctionTicketPaymentPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [acceptedBid, setAcceptedBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketData, bidsData] = await Promise.all([
          pb.collection('auction_tickets').getOne(ticketId, { expand: 'categoryId', $autoCancel: false }),
          pb.collection('bids').getFullList({ filter: `ticketId = "${ticketId}" && status = "accepted"`, $autoCancel: false }),
        ]);
        setTicket(ticketData);
        setAcceptedBid(bidsData[0] || null);
      } catch (err) {
        setError(err.message || 'Could not load details');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [ticketId, currentUser]);

  const amount = Number(acceptedBid?.proposedRate || ticket?.budget || 0);

  const handleContinueFree = async () => {
    setCompleting(true);
    try {
      await pb.collection('auction_tickets').update(ticketId, { status: 'Completed' }, { $autoCancel: false });
      toast({ title: 'Job marked as completed!', description: 'Thank you for using WorkBee.' });
      navigate(`/payment-success?session_id=free_trial&ticketId=${ticketId}`);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 py-12 max-w-xl mx-auto w-full px-4 space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Footer />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Unavailable</h1>
          <p className="text-muted-foreground">{error || 'Ticket not found.'}</p>
          <Button asChild className="rounded-xl"><Link to="/dashboard/client">Back to Dashboard</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <>
      <Helmet><title>Complete Job — WorkBee</title></Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-16 flex items-start justify-center">
          <div className="w-full max-w-lg px-4">

            {/* Free trial banner */}
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 mb-6">
              <Gift className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Free trial — no payment needed</p>
                <p className="text-xs text-muted-foreground mt-0.5">Payments are coming soon. Complete your job for free during the trial period.</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Job</h1>
              <p className="text-muted-foreground">Confirm the job is done and close the ticket.</p>
            </div>

            {/* Order summary */}
            <Card className="bg-card border-border rounded-2xl mb-6">
              <CardHeader><CardTitle className="text-lg">Job Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{ticket.expand?.categoryId?.name || 'Service request'}</span>
                </div>
                {ticket.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Location</span>
                    <span className="text-foreground">{ticket.location}</span>
                  </div>
                )}
                {ticket.durationEstimate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Duration</span>
                    <span className="text-foreground">{ticket.durationEstimate}</span>
                  </div>
                )}
                {amount > 0 && (
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Agreed rate</span>
                    <span className="text-xl font-bold text-foreground line-through opacity-40">€{amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">You pay now</span>
                  <span className="text-2xl font-bold text-primary">€0.00</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleContinueFree}
              disabled={completing}
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              {completing ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />Completing...</>
              ) : (
                <>Complete for Free <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Payments will be enabled in a future update. Your agreed rate is saved on the ticket.
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AuctionTicketPaymentPage;
