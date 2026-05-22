import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import AdminLayout from '@/components/AdminLayout.jsx';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, Database, Server, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StatusDot = ({ status }) => {
  if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />;
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
};

const StatusRow = ({ label, status, detail }) => (
  <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--admin-border))] last:border-0">
    <div className="flex items-center gap-3">
      <StatusDot status={status} />
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
      status === 'ok' ? 'bg-green-400/10 text-green-400' :
      status === 'checking' ? 'bg-yellow-400/10 text-yellow-400' :
      'bg-red-400/10 text-red-400'
    }`}>{detail}</span>
  </div>
);

const StatCard = ({ label, value, sub }) => (
  <div className="admin-card p-5">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const AdminDevPage = () => {
  const [health, setHealth] = useState({
    pocketbase: 'checking',
    api: 'checking',
    stripe: 'checking',
  });
  const [healthDetails, setHealthDetails] = useState({
    pocketbase: '—',
    api: '—',
    stripe: '—',
  });
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const runChecks = async () => {
    setLoading(true);
    setHealth({ pocketbase: 'checking', api: 'checking', stripe: 'checking' });
    setHealthDetails({ pocketbase: '—', api: '—', stripe: '—' });

    // PocketBase health
    const pbStart = Date.now();
    pb.collection('users').getList(1, 1, { $autoCancel: false })
      .then(() => {
        setHealth(h => ({ ...h, pocketbase: 'ok' }));
        setHealthDetails(d => ({ ...d, pocketbase: `${Date.now() - pbStart}ms` }));
      })
      .catch(() => {
        setHealth(h => ({ ...h, pocketbase: 'error' }));
        setHealthDetails(d => ({ ...d, pocketbase: 'unreachable' }));
      });

    // API server health
    const apiStart = Date.now();
    apiServerClient.fetch('/health', { method: 'GET' })
      .then(r => {
        if (r.ok) {
          setHealth(h => ({ ...h, api: 'ok' }));
          setHealthDetails(d => ({ ...d, api: `${Date.now() - apiStart}ms` }));
        } else {
          setHealth(h => ({ ...h, api: 'error' }));
          setHealthDetails(d => ({ ...d, api: `HTTP ${r.status}` }));
        }
      })
      .catch(() => {
        setHealth(h => ({ ...h, api: 'error' }));
        setHealthDetails(d => ({ ...d, api: 'unreachable' }));
      });

    // Stripe (check via API)
    const stripeStart = Date.now();
    apiServerClient.fetch('/stripe/health', { method: 'GET' })
      .then(r => {
        if (r.ok) {
          setHealth(h => ({ ...h, stripe: 'ok' }));
          setHealthDetails(d => ({ ...d, stripe: `${Date.now() - stripeStart}ms` }));
        } else {
          setHealth(h => ({ ...h, stripe: 'error' }));
          setHealthDetails(d => ({ ...d, stripe: `HTTP ${r.status}` }));
        }
      })
      .catch(() => {
        setHealth(h => ({ ...h, stripe: 'error' }));
        setHealthDetails(d => ({ ...d, stripe: 'unreachable' }));
      });

    // DB stats
    try {
      const [users, tickets, bids] = await Promise.all([
        pb.collection('users').getList(1, 1, { $autoCancel: false }),
        pb.collection('auction_tickets').getList(1, 1, { $autoCancel: false }),
        pb.collection('bids').getList(1, 1, { $autoCancel: false }),
      ]);
      setDbStats({ users: users.totalItems, tickets: tickets.totalItems, bids: bids.totalItems });
    } catch (_) {}

    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, []);

  return (
    <>
      <Helmet><title>Dev — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Engineering</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'Running checks…'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runChecks}
            disabled={loading}
            className="border-[hsl(var(--admin-border))] text-white hover:bg-[hsl(var(--admin-border))]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Service health */}
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-white">Service Health</h2>
          </div>
          <StatusRow label="PocketBase" status={health.pocketbase} detail={healthDetails.pocketbase} />
          <StatusRow label="API Server" status={health.api} detail={healthDetails.api} />
          <StatusRow label="Stripe" status={health.stripe} detail={healthDetails.stripe} />
        </div>

        {/* DB record counts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-white">Database</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Users" value={dbStats?.users ?? '—'} />
            <StatCard label="Tickets" value={dbStats?.tickets ?? '—'} />
            <StatCard label="Bids" value={dbStats?.bids ?? '—'} />
          </div>
        </div>

        {/* Quick links */}
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-white">Quick Links</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'PocketBase Admin UI', url: 'https://pocketbase.workbee.space/_/' },
              { label: 'Railway Dashboard', url: 'https://railway.app/dashboard' },
              { label: 'GitHub Repo', url: 'https://github.com/krisatthenet/equalibrinium' },
              { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com' },
              { label: 'Google reCAPTCHA Console', url: 'https://console.cloud.google.com/security/recaptcha' },
              { label: 'Mixpanel', url: 'https://mixpanel.com' },
            ].map(({ label, url }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-border))] transition-colors text-sm text-white"
              >
                {label}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-2 shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="admin-card p-6">
          <h2 className="font-semibold text-white mb-4">Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ['Frontend', 'React + Vite'],
              ['Backend', 'PocketBase + Node.js API'],
              ['Database', 'SQLite via PocketBase'],
              ['Auth', 'PocketBase Auth'],
              ['Payments', 'Stripe Checkout'],
              ['Hosting', 'Railway'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[hsl(var(--admin-border))]/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="font-medium text-white mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDevPage;
