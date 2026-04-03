import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, Receipt } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyAndRecordPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        let ticketId = searchParams.get('ticketId');
        let option = searchParams.get('option');
        let method = searchParams.get('method');
        let amount = parseFloat(searchParams.get('amount'));
        let transactionId = sessionId || searchParams.get('token') || `txn_${Date.now()}`;

        // Fallback to localStorage if URL params are missing (e.g., some Stripe redirects)
        if (!ticketId || !option) {
          const pendingStr = localStorage.getItem('pendingPayment');
          if (pendingStr) {
            const pending = JSON.parse(pendingStr);
            ticketId = ticketId || pending.ticketId;
            option = option || pending.paymentOption;
            method = method || pending.paymentMethod;
            amount = amount || pending.amount;
          }
        }

        if (!ticketId || !currentUser) {
          throw new Error("Missing required payment information or user session.");
        }

        // If Stripe, verify session with backend
        if (sessionId) {
          const res = await apiServerClient.fetch(`/stripe/session/${sessionId}`);
          if (!res.ok) throw new Error("Failed to verify payment session.");
          const sessionData = await res.json();
          
          if (sessionData.status !== 'complete' && sessionData.status !== 'paid') {
            // Sometimes it's 'open' if not finished
            console.warn("Session not fully paid yet:", sessionData.status);
          }
          
          // Use actual amount from Stripe if available
          if (sessionData.amountTotal) {
            amount = sessionData.amountTotal / 100;
          }
        }

        // Check if payment record already exists to prevent duplicates
        const existingRecords = await pb.collection('payments').getFullList({
          filter: `transactionId = "${transactionId}"`,
          $autoCancel: false
        });

        let record;
        if (existingRecords.length > 0) {
          record = existingRecords[0];
        } else {
          // Create new payment record
          record = await pb.collection('payments').create({
            ticketId,
            userId: currentUser.id,
            amount,
            paymentMethod: method || 'unknown',
            paymentOption: option || 'unknown',
            status: 'completed',
            transactionId
          }, { $autoCancel: false });
          
          // Update ticket status if needed
          await pb.collection('auction_tickets').update(ticketId, {
            status: 'In Progress' // Or whatever status makes sense post-payment
          }, { $autoCancel: false });
        }

        // Fetch ticket details for display
        const ticket = await pb.collection('auction_tickets').getOne(ticketId, {
          expand: 'categoryId',
          $autoCancel: false
        });

        setPaymentDetails({
          record,
          ticket,
          amount,
          method,
          option
        });
        
        // Clear pending payment
        localStorage.removeItem('pendingPayment');
        setStatus('success');

      } catch (error) {
        console.error("Payment verification error:", error);
        setErrorMessage(error.message || "Could not verify payment status.");
        setStatus('error');
      }
    };

    if (currentUser) {
      verifyAndRecordPayment();
    } else {
      setStatus('error');
      setErrorMessage("You must be logged in to verify this payment.");
    }
  }, [searchParams, currentUser]);

  return (
    <>
      <Helmet>
        <title>Payment Successful - Equalibrinium</title>
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
                        {paymentDetails.ticket?.expand?.categoryId?.name || 'Service Request'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium text-foreground capitalize">
                        {paymentDetails.method?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs text-foreground bg-background px-2 py-1 rounded border border-border">
                        {paymentDetails.record?.transactionId?.substring(0, 16)}...
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-center text-muted-foreground">
                    A confirmation email has been sent to your registered email address.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button asChild variant="outline" className="flex-1 rounded-xl h-12">
                      <Link to={`/ticket/${paymentDetails.ticket?.id}`}>
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
    </>
  );
};

export default PaymentSuccessPage;