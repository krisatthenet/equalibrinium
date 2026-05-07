import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Briefcase, Loader2, Megaphone, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ProfessionSelector from '@/components/ProfessionSelector.jsx';
import PlacesAutocompleteInput from '@/components/PlacesAutocompleteInput.jsx';

const RegistrationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, resendVerification } = useAuth();
  const { toast } = useToast();
  
  const [userType, setUserType] = useState(searchParams.get('type') || '');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    location: '',
    profession: '',
    instagramHandle: '',
    instagramFollowers: '',
    youtubeChannel: '',
    youtubeFollowers: '',
    tiktokHandle: '',
    tiktokFollowers: '',
    contentNiche: '',
    influencerBio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userType) {
      setError('Please select a user type');
      return;
    }

    if (userType === 'contractor' && !formData.profession) {
      setError('Please select a profession');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const extraData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location
      };
      
      if (userType === 'contractor') {
        extraData.profession = formData.profession;
      } else if (userType === 'influencer') {
        extraData.instagramHandle = formData.instagramHandle;
        extraData.instagramFollowers = formData.instagramFollowers ? parseInt(formData.instagramFollowers) : 0;
        extraData.youtubeChannel = formData.youtubeChannel;
        extraData.youtubeFollowers = formData.youtubeFollowers ? parseInt(formData.youtubeFollowers) : 0;
        extraData.tiktokHandle = formData.tiktokHandle;
        extraData.tiktokFollowers = formData.tiktokFollowers ? parseInt(formData.tiktokFollowers) : 0;
        extraData.contentNiche = formData.contentNiche;
        extraData.influencerBio = formData.influencerBio;
      }

      // Create Account (also sends verification email via signup())
      await signup(formData.email, formData.password, userType, extraData);

      // Don't auto-login — require email verification first
      setRegisteredEmail(formData.email);

    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      
      if (err.response?.data?.email?.code === 'validation_not_unique') {
        // Account already exists — show verify screen (may have been created but verification email failed)
        setRegisteredEmail(formData.email);
      } else if (err.response?.data?.password) {
        setError('Invalid password format. Please ensure it meets the requirements.');
      } else {
        setError(err.message || 'Registration failed. Please check your connection and try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setResendLoading(true);
    try {
      await resendVerification(registeredEmail);
      setResendSent(true);
    } catch (_) {}
    finally { setResendLoading(false); }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const COUNTRY_LANGUAGE_MAP = { LT: 'lt', RU: 'ru', PL: 'pl', BY: 'ru', UA: 'ru' };

  const handleLocationSelect = useCallback((place) => {
    setFormData(prev => ({ ...prev, location: place.address }));
    if (place.countryCode) {
      const lng = COUNTRY_LANGUAGE_MAP[place.countryCode] || 'en';
      i18n.changeLanguage(lng);
    }
  }, []);

  const handleProfessionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      profession: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.register_title')} - WorkBee</title>
        <meta name="description" content={t('auth.register_subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-xl bg-card border-border shadow-xl rounded-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl text-center font-bold">{t('auth.register_title')}</CardTitle>
              <CardDescription className="text-center text-base">
                {t('auth.register_subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registeredEmail ? (
                <div className="flex flex-col items-center text-center py-6 space-y-5">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <MailCheck className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('auth.verify_title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('auth.verify_subtitle', { email: registeredEmail })}
                    </p>
                  </div>
                  {resendSent ? (
                    <p className="text-sm text-primary font-medium">{t('auth.verify_resent')}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                    >
                      {resendLoading ? t('auth.verify_resend_loading') : t('auth.verify_resend')}
                    </button>
                  )}
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                    {t('auth.verify_back_login')}
                  </Link>
                </div>
              ) : !userType ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground mb-6 font-medium">
                    {t('auth.choose_type')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('client')}
                    >
                      <User className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.client_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.client_desc')}</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('contractor')}
                    >
                      <Briefcase className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.contractor_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.contractor_desc')}</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('influencer')}
                    >
                      <Megaphone className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.influencer_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.influencer_desc')}</span>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <Input
                        id="email" name="email" type="email" required
                        value={formData.email} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">{t('auth.full_name')}</Label>
                      <Input
                        id="name" name="name" type="text" required
                        value={formData.name} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <Input
                        id="password" name="password" type="password" required
                        value={formData.password} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">{t('auth.confirm_password')}</Label>
                      <Input
                        id="passwordConfirm" name="passwordConfirm" type="password" required
                        value={formData.passwordConfirm} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    {userType === 'contractor' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="profession">{t('auth.profession')}</Label>
                        <ProfessionSelector 
                          value={formData.profession} 
                          onChange={handleProfessionChange} 
                          required={true}
                        />
                      </div>
                    )}

                    {userType !== 'influencer' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('auth.phone')}</Label>
                          <Input
                            id="phone" name="phone" type="tel"
                            value={formData.phone} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">{t('auth.location')}</Label>
                          <PlacesAutocompleteInput
                            value={formData.location}
                            onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                            onSelectPlace={handleLocationSelect}
                            placeholder="Search for your city or address..."
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {userType === 'influencer' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="instagramHandle">{t('auth.instagram')}</Label>
                          <Input
                            id="instagramHandle" name="instagramHandle" type="text" placeholder="@username"
                            value={formData.instagramHandle} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagramFollowers">{t('auth.followers')} (Instagram)</Label>
                          <Input
                            id="instagramFollowers" name="instagramFollowers" type="number" min="0"
                            value={formData.instagramFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtubeChannel">{t('auth.youtube')}</Label>
                          <Input
                            id="youtubeChannel" name="youtubeChannel" type="text" placeholder="Channel URL or Name"
                            value={formData.youtubeChannel} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtubeFollowers">{t('auth.followers')} (YouTube)</Label>
                          <Input
                            id="youtubeFollowers" name="youtubeFollowers" type="number" min="0"
                            value={formData.youtubeFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktokHandle">{t('auth.tiktok')}</Label>
                          <Input
                            id="tiktokHandle" name="tiktokHandle" type="text" placeholder="@username"
                            value={formData.tiktokHandle} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktokFollowers">{t('auth.followers')} (TikTok)</Label>
                          <Input
                            id="tiktokFollowers" name="tiktokFollowers" type="number" min="0"
                            value={formData.tiktokFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="contentNiche">{t('auth.niche')}</Label>
                          <Input
                            id="contentNiche" name="contentNiche" type="text" placeholder="e.g. Tech, Beauty, Fitness"
                            value={formData.contentNiche} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="influencerBio">{t('auth.bio')}</Label>
                          <Textarea
                            id="influencerBio" name="influencerBio" placeholder="Tell brands about your audience and content..."
                            value={formData.influencerBio} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg min-h-[100px]"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => setUserType('')}
                      disabled={loading}
                    >
                      {t('auth.back')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.registering')}</>
                      ) : (
                        t('auth.register_btn')
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    {t('auth.has_account')}{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      {t('auth.login_btn')}
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default RegistrationPage;