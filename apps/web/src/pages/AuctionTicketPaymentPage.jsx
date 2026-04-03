import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { MapPin, Clock, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PaymentOptionsCard from '@/components/PaymentOptionsCard.jsx';
import PaymentMethodSelector from '@/components/PaymentMethodSelector.jsx';

const AuctionTicketPaymentPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showMethods, setShowMethods] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await pb.collection('auction_tickets').getOne(ticketId, {
          expand: 'categoryId',
          $autoCancel: false
        });
        
        // Ensure ticket has a budget/price to pay against
        if (!data.budget) {
          throw new Error("This ticket does not have a set budget/price for payment.");
        }
        
        setTicket(data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err.message || 'Ticket not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleContinue = () => {
    if (selectedOption) {
      setShowMethods(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 py-12 max-w-7xl mx-auto w-full px-4">
          <Skeleton className="h-[40vh] w-full mb-8 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 lg:col-span-1 rounded-2xl" />
            <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Ticket Not Found</h1>
            <p className="text-muted-foreground">{error || "The ticket you are trying to pay for does not exist or is unavailable."}</p>
            <button 
              onClick={() => navigate('/dashboard/client')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Payment - {ticket.expand?.categoryId?.name || 'Ticket'}</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        {/* Hero Section */}
        <div className="relative h-[35vh] min-h-[300px] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1696246073379-a3a523beffd8" 
              alt="Payment Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          </div>
          <div className="absolute inset-0 flex items-end pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <Badge className="mb-4 bg-primary text-primary-foreground border-none px-3 py-1 text-sm">
                Secure Checkout
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">
                Complete Your Payment
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Choose your preferred payment option to secure your booking for {ticket.expand?.categoryId?.name || 'this service'}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Ticket Details */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-28">
                  <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-4">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Service</p>
                      <p className="font-medium text-foreground">{ticket.expand?.categoryId?.name || 'Custom Service Request'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground line-clamp-3">{ticket.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.location || 'Location not specified'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.durationEstimate || 'Duration not specified'}</span>
                    </div>

                    {ticket.files && ticket.files.length > 0 && (
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{ticket.files.length} attachment(s) included</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="text-2xl font-bold text-foreground">€{ticket.budget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Flow */}
              <div className="lg:col-span-8">
                {!showMethods ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">1. Select Payment Option</h2>
                      <p className="text-muted-foreground">Choose how you would like to pay for this service.</p>
                    </div>

                    <PaymentOptionsCard 
                      price={ticket.budget} 
                      selectedOption={selectedOption} 
                      onSelectOption={setSelectedOption} 
                    />

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleContinue}
                        disabled={!selectedOption}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                          selectedOption 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <PaymentMethodSelector 
                      ticketId={ticket.id}
                      price={ticket.budget}
                      selectedOption={selectedOption}
                      onBack={() => setShowMethods(false)}
                    />
                  </div>
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

export default AuctionTicketPaymentPage;