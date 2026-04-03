import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCcw, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const PaymentErrorPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Payment Failed - Equalibrinium</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="bg-card border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-destructive/10 p-8 flex flex-col items-center justify-center border-b border-border">
                <div className="h-20 w-20 bg-destructive rounded-full flex items-center justify-center mb-6 shadow-lg shadow-destructive/20">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Payment Failed</h1>
                <p className="text-destructive font-medium text-center">
                  We couldn't process your transaction.
                </p>
              </div>
              
              <CardContent className="p-8 space-y-6">
                <div className="bg-muted/50 rounded-xl p-5 text-sm text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground">Common reasons for failure:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Insufficient funds or card limit reached</li>
                    <li>Incorrect card details entered</li>
                    <li>Transaction declined by your bank</li>
                    <li>Session timeout or network error</li>
                  </ul>
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  No charges were made to your account. You can safely try again or use a different payment method.
                </p>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={() => navigate(-1)} 
                    className="w-full rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button asChild variant="outline" className="rounded-xl h-12">
                      <Link to="/dashboard/client">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="rounded-xl h-12 hover:bg-muted">
                      <Link to="/contact">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Support
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PaymentErrorPage;