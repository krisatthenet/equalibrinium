import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    pb.collection('users').confirmVerification(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <>
      <Helmet>
        <title>Email Verification - WorkBee</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="p-4 bg-green-500/10 rounded-full w-fit mx-auto mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-6">
                  Your account is now active. You can log in and start using WorkBee.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto mb-6">
                  <XCircle className="h-16 w-16 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                <p className="text-muted-foreground mb-6">
                  This link is invalid or has expired. Please request a new verification email.
                </p>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/login">Back to Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default VerifyEmailPage;
