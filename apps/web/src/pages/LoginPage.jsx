import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { verifyRecaptcha } from '@/lib/recaptcha.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const captchaOk = await verifyRecaptcha('LOGIN');
    if (!captchaOk) {
      setError('Security check failed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const authData = await login(formData.email, formData.password);
      const type = authData.record.userType;
      const redirectPath = type === 'contractor' ? '/dashboard/contractor'
        : type === 'influencer' ? '/dashboard/influencer'
        : '/dashboard/client';
      navigate(redirectPath);
    } catch (err) {
      console.error('[Login Error]', err);
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await requestPasswordReset(formData.email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Login - WorkBee</title>
        <meta name="description" content="Login to your WorkBee account to access your dashboard and manage your projects." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md bg-card border-border rounded-2xl shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-center font-bold">{t('auth.login_title')}</CardTitle>
              <CardDescription className="text-center">
                {t('auth.login_subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}



                {resetSent && (
                  <Alert className="rounded-xl bg-primary/10 text-primary border-primary/20">
                    <AlertDescription>
                      {t('auth.reset_sent')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-input border-border text-foreground rounded-lg"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {t('auth.forgot_password')}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl h-11 font-semibold mt-2"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.logging_in')}</>
                  ) : (
                    t('auth.login_btn')
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {t('auth.no_account')}{' '}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    {t('header.register')}
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;