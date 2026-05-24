import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { verifyRecaptcha } from '@/lib/recaptcha.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login state
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openReset = () => {
    setResetEmail(formData.email);
    setResetNewPass('');
    setResetConfirm('');
    setResetError('');
    setResetDone(false);
    setShowReset(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail) return setResetError('Please enter your email address.');
    if (resetNewPass.length < 8) return setResetError('Password must be at least 8 characters.');
    if (resetNewPass !== resetConfirm) return setResetError('Passwords do not match.');

    setResetLoading(true);
    try {
      const res = await apiServerClient.fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword: resetNewPass }),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data.error || 'Reset failed. Please try again.');

      setResetDone(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
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

            {!showReset ? (
              <>
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-center font-bold">{t('auth.login_title')}</CardTitle>
                  <CardDescription className="text-center">{t('auth.login_subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>
                          {error}
                          {error.toLowerCase().includes('security check') && (
                            <span className="block mt-1 text-xs">
                              If you have an ad blocker enabled, please disable it on this page and try again.
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <Input
                        id="email" name="email" type="email" required
                        value={formData.email} onChange={handleChange}
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

                    <div className="flex justify-end">
                      <button type="button" onClick={openReset} className="text-sm text-primary hover:underline font-medium">
                        {t('auth.forgot_password')}
                      </button>
                    </div>

                    <Button
                      type="submit" disabled={loading}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl h-11 font-semibold mt-2"
                    >
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.logging_in')}</> : t('auth.login_btn')}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                      {t('auth.no_account')}{' '}
                      <Link to="/register" className="text-primary hover:underline font-medium">{t('header.register')}</Link>
                    </p>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </button>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Reset your password
                  </CardTitle>
                  <CardDescription>
                    Enter your email and a new password to reset it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resetDone ? (
                    <div className="space-y-4 text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-semibold text-foreground">Password updated!</p>
                      <p className="text-sm text-muted-foreground">You can now log in with your new password.</p>
                      <Button className="w-full rounded-xl" onClick={() => { setShowReset(false); setFormData(d => ({ ...d, email: resetEmail, password: '' })); }}>
                        Go to login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleReset} className="space-y-4">
                      {resetError && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription>
                            {resetError}
                            {resetError.toLowerCase().includes('security check') && (
                              <span className="block mt-1 text-xs">
                                If you have an ad blocker enabled, please disable it on this page and try again.
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email address</Label>
                        <Input
                          id="reset-email" type="email" required
                          value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          className="bg-input border-border text-foreground rounded-lg"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reset-new-pass">New password</Label>
                        <Input
                          id="reset-new-pass" type="password" required
                          value={resetNewPass} onChange={e => setResetNewPass(e.target.value)}
                          className="bg-input border-border text-foreground rounded-lg"
                          placeholder="Min. 8 characters"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reset-confirm">Confirm new password</Label>
                        <Input
                          id="reset-confirm" type="password" required
                          value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                          className="bg-input border-border text-foreground rounded-lg"
                          placeholder="Repeat password"
                        />
                      </div>

                      <Button
                        type="submit" disabled={resetLoading}
                        className="w-full rounded-xl h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {resetLoading
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                          : <><ShieldCheck className="mr-2 h-4 w-4" /> Reset password</>}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;
