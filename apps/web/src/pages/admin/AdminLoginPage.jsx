import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error: contextError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';
  const isTimeout = new URLSearchParams(location.search).get('timeout') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Invalid credentials or unauthorized access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || contextError;

  return (
    <>
      <Helmet>
        <title>Admin Login - WorkBee</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Portal</h1>
            <p className="text-muted-foreground mt-2 text-sm">Restricted access — authorised personnel only</p>
          </div>

          {/* Card */}
          <div className="admin-card p-8">
            {isTimeout && (
              <Alert className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 rounded-xl">
                <AlertDescription>Your session has expired. Please sign in again.</AlertDescription>
              </Alert>
            )}

            {displayError && (
              <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20 rounded-xl">
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="admin-input rounded-xl"
                  placeholder="admin@workbee.space"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="admin-input rounded-xl"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base font-semibold mt-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating…</>
                  : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
