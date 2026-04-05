import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, AlertCircle, CreditCard, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

const AuctionTicketPaymentPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [acceptedBid, setAcceptedBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
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
        setError(err.message || 'Could not load payment details');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [ticketId, currentUser]);

  const amount = Number(acceptedBid?.proposedRate || ticket?.budget || 0);

  const handlePay = async () => {
    if (amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please contact support.', variant: 'destructive' });
      return;
    }
    setPaying(true);
    try {
      const res = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          contractorUserId: acceptedBid?.masterId || null,
          amount,
          userId: currentUser.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start checkout');
      }

      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned');

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      toast({ title: 'Payment error', description: err.message, variant: 'destructive' });
      setPaying(false);
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
          <h1 className="text-2xl font-bold">Payment Unavailable</h1>
          <p className="text-muted-foreground">{error || 'Ticket not found.'}</p>
          <Button asChild className="rounded-xl"><Link to="/dashboard/client">Back to Dashboard</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <>
      <Helmet><title>Complete Payment — WorkBee</title></Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-16 flex items-start justify-center">
          <div className="w-full max-w-lg px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Complete Payment</h1>
              <p className="text-muted-foreground">You'll be redirected to Stripe's secure checkout</p>
            </div>

            {/* Order summary */}
            <Card className="bg-card border-border rounded-2xl mb-6">
              <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{ticket.expand?.categoryId?.name || 'Paslaugų užklausa'}</span>
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
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-3xl font-bold text-foreground">€{amount.toFixed(2)}</span>
                </div>
                {acceptedBid && (
                  <p className="text-xs text-muted-foreground">Agreed rate from accepted bid</p>
                )}
              </CardContent>
            </Card>

            {/* Pay button */}
            <Button
              onClick={handlePay}
              disabled={paying || amount <= 0}
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              {paying ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />Redirecting to Stripe...</>
              ) : (
                <><CreditCard className="h-5 w-5 mr-2" />Pay €{amount.toFixed(2)} with Card</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                256-bit SSL encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Powered by Stripe
              </span>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AuctionTicketPaymentPage;
