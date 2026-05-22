import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, Receipt, Star } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReviewModal from '@/components/ReviewModal.jsx';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const ticketId = searchParams.get('ticketId');

        if (!ticketId || !currentUser) {
          throw new Error('Missing payment information or user session.');
        }
        if (!sessionId) {
          throw new Error('No session ID found.');
        }

        let verifiedTicketId = ticketId;
        let amount = 0;

        if (sessionId === 'free_trial') {
          // Free trial — ticket already marked completed by the payment page
        } else {
          // Verify real Stripe session with backend
          const res = await apiServerClient.fetch(`/stripe/session/${sessionId}?userId=${currentUser.id}`);
          if (!res.ok) throw new Error('Failed to verify payment session.');
          const sessionData = await res.json();

          if (sessionData.status !== 'paid') {
            throw new Error(`Payment not confirmed (status: ${sessionData.status}). Please contact support.`);
          }

          verifiedTicketId = sessionData.ticketId;
          if (!verifiedTicketId) {
            throw new Error('Session metadata incomplete. Please contact support.');
          }

          amount = (sessionData.amountTotal || 0) / 100;

          // Mark ticket as Completed (webhook does this too, but may not reach localhost in dev)
          await pb.collection('auction_tickets').update(verifiedTicketId, { status: 'Completed' }, { $autoCancel: false }).catch(() => {});
        }

        // Fetch ticket for display
        const ticket = await pb.collection('auction_tickets').getOne(verifiedTicketId, {
          expand: 'categoryId',
          $autoCancel: false
        });

        // Find contractor for review link
        const bids = await pb.collection('bids').getFullList({
          filter: `ticketId = "${verifiedTicketId}" && status = "accepted"`,
          $autoCancel: false
        }).catch(() => []);
        if (bids.length > 0 && bids[0].masterId) {
          const c = await pb.collection('users').getOne(bids[0].masterId, { $autoCancel: false }).catch(() => null);
          if (c) setReviewTarget({ contractorId: c.id, contractorName: c.name, ticketId: verifiedTicketId });
        }

        setPaymentDetails({ ticket, amount, sessionId });
        localStorage.removeItem('pendingPayment');
        setStatus('success');
      } catch (error) {
        console.error('Payment verification error:', error);
        setErrorMessage(error.message || 'Could not verify payment status.');
        setStatus('error');
      }
    };

    if (currentUser) {
      verify();
    } else {
      setStatus('error');
      setErrorMessage('You must be logged in to verify this payment.');
    }
  }, [searchParams, currentUser]);

  return (
    <>
      <Helmet>
        <title>Payment Successful - WorkBee</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-lg w-full">
            {status === 'verifying' && (
              <Card className="bg-card border-border rounded-2xl shadow-lg text-center py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <h2 className="text-2xl font-bold text-foreground">Verifying Payment...</h2>
                  <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
                </CardContent>
              </Card>
            )}

            {status === 'success' && paymentDetails && (
              <Card className="bg-card border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="bg-green-500/10 p-8 flex flex-col items-center justify-center border-b border-border">
                  <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
                  <p className="text-green-600 font-medium">Your transaction has been completed.</p>
                  {!reviewDone ? (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="mt-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1"
                    >
                      <Star className="h-3.5 w-3.5" /> Leave a review
                    </button>
                  ) : (
                    <p className="mt-2 text-sm text-green-600">✓ Review submitted, thank you!</p>
                  )}
                </div>

                <CardContent className="p-8 space-y-6">
                  <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-2xl font-bold text-foreground">€{paymentDetails.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                        {paymentDetails.ticket?.expand?.categoryId?.name || 'Paslaugų užklausa'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium text-foreground">Stripe / Card</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Session ID</span>
                      <span className="font-mono text-xs text-foreground bg-background px-2 py-1 rounded border border-border">
                        {paymentDetails.sessionId?.substring(0, 20)}...
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-center text-muted-foreground">
                    A confirmation email has been sent to your registered email address.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button asChild variant="outline" className="flex-1 rounded-xl h-12">
                      <Link to={`/auction-ticket/${paymentDetails.ticket?.id}`}>
                        <Receipt className="mr-2 h-4 w-4" />
                        View Ticket
                      </Link>
                    </Button>
                    <Button asChild className="flex-1 rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link to="/dashboard/client">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {status === 'error' && (
              <Card className="bg-card border-destructive/20 rounded-2xl shadow-lg text-center py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-6">
                  <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h2>
                    <p className="text-muted-foreground">{errorMessage}</p>
                  </div>
                  <Button asChild className="rounded-xl mt-4">
                    <Link to="/dashboard/client">Return to Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        contractorId={reviewTarget?.contractorId}
        contractorName={reviewTarget?.contractorName}
        ticketId={reviewTarget?.ticketId ?? searchParams.get('ticketId')}
        onSubmitted={() => { setReviewDone(true); setShowReviewModal(false); }}
      />
    </>
  );
};

export default PaymentSuccessPage;
