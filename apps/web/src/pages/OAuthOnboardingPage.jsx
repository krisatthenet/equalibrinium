import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Megaphone, Loader2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const OAuthOnboardingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.userType) {
      const type = currentUser.userType;
      navigate(
        type === 'contractor' ? '/dashboard/contractor'
        : type === 'influencer' ? '/dashboard/influencer'
        : '/dashboard/client',
        { replace: true }
      );
    }
  }, [currentUser, navigate]);

  const handleSelectType = async (type) => {
    setLoading(true);
    setError('');
    try {
      await pb.collection('users').update(currentUser.id, { userType: type });
      await refreshUser();
      navigate(
        type === 'contractor' ? '/dashboard/contractor'
        : type === 'influencer' ? '/dashboard/influencer'
        : '/dashboard/client',
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Choose your account type - WorkBee</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-xl bg-card border-border shadow-xl rounded-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl text-center font-bold">One last step</CardTitle>
              <CardDescription className="text-center text-base">
                How will you be using WorkBee?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  disabled={loading}
                  className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                  onClick={() => handleSelectType('client')}
                >
                  {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <User className="h-8 w-8 text-primary" />}
                  <div className="text-center">
                    <span className="font-semibold block">{t('auth.client_type')}</span>
                    <span className="text-xs text-muted-foreground">{t('auth.client_desc')}</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                  onClick={() => handleSelectType('contractor')}
                >
                  {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Briefcase className="h-8 w-8 text-primary" />}
                  <div className="text-center">
                    <span className="font-semibold block">{t('auth.contractor_type')}</span>
                    <span className="text-xs text-muted-foreground">{t('auth.contractor_desc')}</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                  onClick={() => handleSelectType('influencer')}
                >
                  {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Megaphone className="h-8 w-8 text-primary" />}
                  <div className="text-center">
                    <span className="font-semibold block">{t('auth.influencer_type')}</span>
                    <span className="text-xs text-muted-foreground">{t('auth.influencer_desc')}</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default OAuthOnboardingPage;
