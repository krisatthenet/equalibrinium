import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

const PaymentMethodSelector = ({ ticketId, price, selectedOption, onBack }) => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate amount for display and Stripe
  const calculatedAmount = selectedOption === 'advance_20' ? price * 0.2 : price * 0.85;

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&ticketId=${ticketId}&option=${selectedOption}&method=stripe&amount=${calculatedAmount}`;
      const cancelUrl = `${window.location.origin}/payment-error`;

      // Store pending payment info in localStorage as fallback
      localStorage.setItem('pendingPayment', JSON.stringify({
        ticketId,
        amount: calculatedAmount,
        paymentOption: selectedOption,
        paymentMethod: 'stripe',
        timestamp: new Date().getTime()
      }));

      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculatedAmount,
          ticketId,
          userId: currentUser.id,
          paymentOption: selectedOption,
          successUrl,
          cancelUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize Stripe checkout');
      }

      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Checkout Opened",
          description: "Please complete your payment in the new tab.",
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Stripe error:', error);
      toast({
        title: "Payment Error",
        description: "Could not initialize Stripe payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleWalletPayment = async () => {
    setLoading(true);
    try {
      // Map frontend option to the exact string expected by the updated backend
      const backendPaymentOption = selectedOption === 'advance_20' 
        ? '20% Advance' 
        : 'Full with 15% Discount';

      const response = await apiServerClient.fetch('/google-wallet/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price, // Backend now expects the full original amount
          ticketId,
          paymentOption: backendPaymentOption
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize Google Wallet');
      }

      const data = await response.json();
      
      if (data.token) {
        // Simulate Google Pay UI delay for the token processing
        setTimeout(() => {
          // Use the paymentAmount returned from the backend, fallback to calculatedAmount
          const finalAmount = data.paymentAmount || calculatedAmount;
          navigate(`/payment-success?ticketId=${ticketId}&option=${selectedOption}&method=google_wallet&amount=${finalAmount}&token=${data.token.substring(0, 10)}`);
        }, 1500);
      } else {
        throw new Error('No payment token returned');
      }
    } catch (error) {
      console.error('Google Wallet error:', error);
      toast({
        title: "Payment Error",
        description: "Could not initialize Google Wallet. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full" disabled={loading}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Select Payment Method</CardTitle>
        </div>
        <CardDescription>
          You are about to pay <span className="font-bold text-foreground">€{calculatedAmount.toFixed(2)}</span> for your selected option.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={handleStripePayment} 
            disabled={loading}
            className="w-full h-16 text-base bg-[#635BFF] hover:bg-[#635BFF]/90 text-white rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-6 w-6 mb-1" />
                <span>Pay with Stripe</span>
              </>
            )}
          </Button>

          <Button 
            onClick={handleGoogleWalletPayment} 
            disabled={loading}
            variant="outline"
            className="w-full h-16 text-base border-2 border-border hover:bg-muted hover:border-foreground/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Wallet className="h-6 w-6 mb-1" />
                <span>Google Pay</span>
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-6 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          Payments are secure and encrypted
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;