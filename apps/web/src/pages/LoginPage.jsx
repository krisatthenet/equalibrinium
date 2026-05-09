import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MailCheck } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGitHub, logout, requestPasswordReset, resendVerification } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = await login(formData.email, formData.password);

      // Block unverified accounts
      if (!authData.record.verified) {
        logout();
        setUnverifiedEmail(formData.email);
        return;
      }

      const type = authData.record.userType;
      const redirectPath = type === 'contractor' ? '/dashboard/contractor'
        : type === 'influencer' ? '/dashboard/influencer'
        : '/dashboard/client';
      navigate(redirectPath);
    } catch (err) {
      console.error('[Login Error]', err);
      
      const errorMessage = 'Invalid credentials.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      await resendVerification(unverifiedEmail);
      setResendSent(true);
    } catch (_) {}
    finally { setResendLoading(false); }
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

  const handleGitHubLogin = async () => {
    setGithubLoading(true);
    setError('');
    try {
      const authData = await loginWithGitHub();
      const type = authData.record.userType;
      const redirectPath = type === 'contractor' ? '/dashboard/contractor'
        : type === 'influencer' ? '/dashboard/influencer'
        : '/dashboard/client';
      navigate(redirectPath);
    } catch (err) {
      if (err?.message !== 'The auth popup was closed.') {
        setError('GitHub login failed. Please try again.');
      }
    } finally {
      setGithubLoading(false);
    }
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

                {unverifiedEmail && (
                  <Alert className="rounded-xl border-yellow-500/30 bg-yellow-500/10">
                    <MailCheck className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      {t('auth.verify_required')}{' '}
                      {resendSent ? (
                        <span className="font-medium">{t('auth.verify_resent')}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendLoading}
                          className="font-medium underline hover:no-underline disabled:opacity-50"
                        >
                          {resendLoading ? t('auth.verify_resend_loading') : t('auth.verify_resend_link')}
                        </button>
                      )}
                    </AlertDescription>
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

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={githubLoading}
                  onClick={handleGitHubLogin}
                  className="w-full rounded-xl h-11 font-semibold border-border hover:bg-muted/50 flex items-center gap-2"
                >
                  {githubLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  Continue with GitHub
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