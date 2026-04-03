import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState([]);
  const [userDistData, setUserDistData] = useState([]);
  const [ticketStatusData, setTicketStatusData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch users for distribution
        const users = await pb.collection('users').getFullList({ $autoCancel: false });
        const clients = users.filter(u => u.userType === 'client').length;
        const contractors = users.filter(u => u.userType === 'master' || u.userType === 'contractor').length;
        const influencers = users.filter(u => u.userType === 'influencer').length;
        
        setUserDistData([
          { name: 'Clients', value: clients },
          { name: 'Contractors', value: contractors },
          { name: 'Influencers', value: influencers }
        ]);

        // Fetch tickets for status and income
        const tickets = await pb.collection('auction_tickets').getFullList({ $autoCancel: false });
        
        const open = tickets.filter(t => t.status === 'Open').length;
        const inProgress = tickets.filter(t => t.status === 'In Progress').length;
        const completed = tickets.filter(t => t.status === 'Completed').length;
        const cancelled = tickets.filter(t => t.status === 'Cancelled').length;

        setTicketStatusData([
          { name: 'Open', value: open },
          { name: 'In Progress', value: inProgress },
          { name: 'Completed', value: completed },
          { name: 'Cancelled', value: cancelled }
        ]);

        // Mock income data based on completed tickets (grouping by month would require more complex logic, using simple mock for visual)
        const mockIncome = [
          { name: 'Jan', income: 4000 },
          { name: 'Feb', income: 3000 },
          { name: 'Mar', income: 2000 },
          { name: 'Apr', income: 2780 },
          { name: 'May', income: 1890 },
          { name: 'Jun', income: 2390 },
          { name: 'Jul', income: 3490 },
        ];
        setIncomeData(mockIncome);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border))] p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Analytics - Admin Portal</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Deep dive into platform performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Revenue Overview</h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full bg-[hsl(var(--admin-border))]" />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--admin-primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--admin-primary))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Ticket Status Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ticket Completion Rate</h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full bg-[hsl(var(--admin-border))]" />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketStatusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--admin-border))' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">User Distribution</h3>
          {loading ? (
            <Skeleton className="h-[300px] w-full bg-[hsl(var(--admin-border))]" />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {userDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;