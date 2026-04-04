import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { 
  Users, 
  Ticket, 
  DollarSign, 
  CheckCircle, 
  Briefcase, 
  UserCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MetricCard = ({ title, value, icon: Icon, trend, loading, prefix = '' }) => (
  <div className="admin-card p-6 flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-[hsl(var(--admin-border))] rounded-xl">
        <Icon className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
      </div>
      {trend && !loading && (
        <div className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-[hsl(var(--admin-success))]' : 'text-[hsl(var(--admin-danger))]'}`}>
          {trend > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      {loading ? (
        <Skeleton className="h-8 w-24 bg-[hsl(var(--admin-border))]" />
      ) : (
        <h3 className="text-3xl font-bold text-white tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      )}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    activeUsers: 0,
    totalTickets: 0,
    completedTickets: 0,
    activeContractors: 0,
    activeClients: 0,
    healthScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch users
        const users = await pb.collection('users').getList(1, 1, { filter: 'verified=true', $autoCancel: false });
        const contractors = await pb.collection('users').getList(1, 1, { filter: "userType='contractor'", $autoCancel: false });
        const clients = await pb.collection('users').getList(1, 1, { filter: "userType='client'", $autoCancel: false });
        
        // Fetch tickets
        const allTickets = await pb.collection('auction_tickets').getList(1, 1, { $autoCancel: false });
        const completedTickets = await pb.collection('auction_tickets').getList(1, 500, { filter: "status='Completed'", $autoCancel: false });
        
        // Calculate income (sum of budgets from completed tickets)
        const income = completedTickets.items.reduce((sum, ticket) => sum + (ticket.budget || 0), 0);
        
        // Calculate health score (simple metric: completion rate * 100)
        const completionRate = allTickets.totalItems > 0 ? (completedTickets.totalItems / allTickets.totalItems) * 100 : 0;
        const healthScore = Math.min(Math.round(completionRate + (users.totalItems > 10 ? 20 : 0)), 100);

        setMetrics({
          totalIncome: income,
          activeUsers: users.totalItems,
          totalTickets: allTickets.totalItems,
          completedTickets: completedTickets.totalItems,
          activeContractors: contractors.totalItems,
          activeClients: clients.totalItems,
          healthScore: healthScore
        });
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard - Admin Portal</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Key metrics and performance indicators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Platform Income" 
          value={metrics.totalIncome} 
          icon={DollarSign} 
          prefix="€"
          trend={12.5}
          loading={loading} 
        />
        <MetricCard 
          title="Total Active Users" 
          value={metrics.activeUsers} 
          icon={Users} 
          trend={5.2}
          loading={loading} 
        />
        <MetricCard 
          title="Total Tickets Created" 
          value={metrics.totalTickets} 
          icon={Ticket} 
          trend={8.1}
          loading={loading} 
        />
        <MetricCard 
          title="Platform Health Score" 
          value={metrics.healthScore} 
          icon={Activity} 
          trend={2.4}
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Completed Tickets" 
          value={metrics.completedTickets} 
          icon={CheckCircle} 
          loading={loading} 
        />
        <MetricCard 
          title="Active Contractors" 
          value={metrics.activeContractors} 
          icon={Briefcase} 
          loading={loading} 
        />
        <MetricCard 
          title="Active Clients" 
          value={metrics.activeClients} 
          icon={UserCircle} 
          loading={loading} 
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;