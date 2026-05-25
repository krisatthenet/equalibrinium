import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Briefcase, Megaphone, Loader2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const EMPTY_INFLUENCER = {
  instagramHandle: '',
  instagramFollowers: '',
  youtubeChannel: '',
  youtubeFollowers: '',
  tiktokHandle: '',
  tiktokFollowers: '',
  contentNiche: '',
  influencerBio: '',
};

const OAuthOnboardingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('type'); // 'type' | 'influencer'
  const [influencerData, setInfluencerData] = useState(EMPTY_INFLUENCER);

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
    if (type === 'influencer') {
      setStep('influencer');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await pb.collection('users').update(currentUser.id, { userType: type });
      await refreshUser();
      navigate(
        type === 'contractor' ? '/dashboard/contractor' : '/dashboard/client',
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const handleInfluencerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await pb.collection('users').update(currentUser.id, {
        userType: 'influencer',
        instagramHandle: influencerData.instagramHandle,
        instagramFollowers: parseInt(influencerData.instagramFollowers) || 0,
        youtubeChannel: influencerData.youtubeChannel,
        youtubeFollowers: parseInt(influencerData.youtubeFollowers) || 0,
        tiktokHandle: influencerData.tiktokHandle,
        tiktokFollowers: parseInt(influencerData.tiktokFollowers) || 0,
        contentNiche: influencerData.contentNiche,
        influencerBio: influencerData.influencerBio,
      });
      await refreshUser();
      navigate('/dashboard/influencer', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setInfluencerData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

          {step === 'type' && (
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
          )}

          {step === 'influencer' && (
            <Card className="w-full max-w-2xl bg-card border-border shadow-xl rounded-2xl">
              <CardHeader className="pb-6">
                <button
                  onClick={() => setStep('type')}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 w-fit"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-primary" /> Your social presence
                </CardTitle>
                <CardDescription>
                  Tell brands about your channels. You can update these later in Settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="rounded-xl mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleInfluencerSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagramHandle">{t('auth.instagram')}</Label>
                      <Input
                        id="instagramHandle" name="instagramHandle" placeholder="@username"
                        value={influencerData.instagramHandle} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagramFollowers">{t('auth.followers')} (Instagram)</Label>
                      <Input
                        id="instagramFollowers" name="instagramFollowers" type="number" min="0" placeholder="0"
                        value={influencerData.instagramFollowers} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeChannel">{t('auth.youtube')}</Label>
                      <Input
                        id="youtubeChannel" name="youtubeChannel" placeholder="Channel URL or name"
                        value={influencerData.youtubeChannel} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeFollowers">{t('auth.followers')} (YouTube)</Label>
                      <Input
                        id="youtubeFollowers" name="youtubeFollowers" type="number" min="0" placeholder="0"
                        value={influencerData.youtubeFollowers} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktokHandle">{t('auth.tiktok')}</Label>
                      <Input
                        id="tiktokHandle" name="tiktokHandle" placeholder="@username"
                        value={influencerData.tiktokHandle} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktokFollowers">{t('auth.followers')} (TikTok)</Label>
                      <Input
                        id="tiktokFollowers" name="tiktokFollowers" type="number" min="0" placeholder="0"
                        value={influencerData.tiktokFollowers} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contentNiche">{t('auth.niche')}</Label>
                      <Input
                        id="contentNiche" name="contentNiche" placeholder="e.g. Tech, Beauty, Fitness"
                        value={influencerData.contentNiche} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="influencerBio">{t('auth.bio')}</Label>
                      <Textarea
                        id="influencerBio" name="influencerBio"
                        placeholder="Tell brands about your audience and content..."
                        value={influencerData.influencerBio} onChange={handleChange}
                        className="bg-input border-border text-foreground min-h-[100px] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Complete setup
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={loading}
                      className="text-muted-foreground rounded-xl"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await pb.collection('users').update(currentUser.id, { userType: 'influencer' });
                          await refreshUser();
                          navigate('/dashboard/influencer', { replace: true });
                        } catch (err) {
                          setError(err.message || 'Failed to save.');
                          setLoading(false);
                        }
                      }}
                    >
                      Skip for now
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

        </div>

        <Footer />
      </div>
    </>
  );
};

export default OAuthOnboardingPage;
