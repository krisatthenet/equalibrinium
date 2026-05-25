import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import AdminLayout from '@/components/AdminLayout.jsx';
import { Users, TrendingUp, Gift, UserCheck, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#facc15', '#3b82f6', '#10b981', '#8b5cf6'];

const StatCard = ({ label, value, icon: Icon, sub, loading }) => (
  <div className="admin-card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="p-2 rounded-lg bg-[hsl(var(--admin-border))]">
        <Icon className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
      </div>
    </div>
    {loading ? <Skeleton className="h-8 w-24 bg-[hsl(var(--admin-border))]" /> : (
      <p className="text-3xl font-bold text-foreground">{value}</p>
    )}
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

const AdminMarketingPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    totalReferrals: 0,
  });
  const [userTypeData, setUserTypeData] = useState([]);
  const [signupsByMonth, setSignupsByMonth] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const users = await pb.collection('users').getFullList({ sort: '-created', $autoCancel: false });

        const now = new Date();
        const weekAgo = new Date(now - 7 * 86400000);
        const monthAgo = new Date(now - 30 * 86400000);

        const newThisWeek = users.filter(u => new Date(u.created) >= weekAgo).length;
        const newThisMonth = users.filter(u => new Date(u.created) >= monthAgo).length;

        // User type distribution
        const typeCounts = {};
        users.forEach(u => {
          const t = u.userType || 'unknown';
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        setUserTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

        // Signups by month (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleString('default', { month: 'short' });
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
          const count = users.filter(u => {
            const c = new Date(u.created);
            return c >= start && c <= end;
          }).length;
          months.push({ month: label, signups: count });
        }
        setSignupsByMonth(months);

        // Top referrers
        const referralCounts = {};
        users.forEach(u => {
          if (u.referredBy) referralCounts[u.referredBy] = (referralCounts[u.referredBy] || 0) + 1;
        });
        const sorted = Object.entries(referralCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);
        const enriched = sorted.map(([userId, count]) => {
          const user = users.find(u => u.id === userId);
          return { name: user?.name || user?.email || userId, count };
        });
        setTopReferrers(enriched);

        // Referral total
        const referred = users.filter(u => u.referredBy).length;

        setStats({
          totalUsers: users.length,
          newThisWeek,
          newThisMonth,
          totalReferrals: referred,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Helmet><title>Marketing — Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">User growth, acquisition, and referrals</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} loading={loading} />
          <StatCard label="New This Week" value={stats.newThisWeek} icon={TrendingUp} loading={loading} sub="+last 7 days" />
          <StatCard label="New This Month" value={stats.newThisMonth} icon={UserCheck} loading={loading} sub="+last 30 days" />
          <StatCard label="Referred Signups" value={stats.totalReferrals} icon={Gift} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signups by month */}
          <div className="admin-card p-6">
            <h2 className="font-semibold text-foreground mb-4">Signups — Last 6 Months</h2>
            {loading ? <Skeleton className="h-48 w-full bg-[hsl(var(--admin-border))]" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={signupsByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--admin-sidebar))', border: '1px solid hsl(var(--admin-border))', borderRadius: 8 }}
                    labelStyle={{ color: 'white' }}
                    itemStyle={{ color: '#facc15' }}
                  />
                  <Bar dataKey="signups" fill="#facc15" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* User type distribution */}
          <div className="admin-card p-6">
            <h2 className="font-semibold text-foreground mb-4">User Types</h2>
            {loading ? <Skeleton className="h-48 w-full bg-[hsl(var(--admin-border))]" /> : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {userTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--admin-sidebar))', border: '1px solid hsl(var(--admin-border))', borderRadius: 8 }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {userTypeData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="capitalize text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top referrers */}
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-foreground">Top Referrers</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-[hsl(var(--admin-border))]" />)}</div>
          ) : topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {topReferrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[hsl(var(--admin-border))] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">#{i + 1}</span>
                    <span className="text-sm text-foreground font-medium">{r.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[hsl(var(--admin-primary))]">{r.count} referral{r.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMarketingPage;
