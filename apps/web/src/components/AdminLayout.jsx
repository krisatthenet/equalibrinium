import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  LayoutDashboard, Users, Ticket, Star, BarChart3, LogOut,
  ShieldAlert, Code2, Megaphone, HeadphonesIcon, DollarSign, FileText, Kanban
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NavSection = ({ title, items, location }) => (
  <div className="mb-4">
    <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{title}</p>
    {items.map(({ path, label, icon: Icon }) => {
      const isActive = location.pathname === path;
      return (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 ${
            isActive
              ? 'bg-[hsl(var(--admin-primary))]/15 text-[hsl(var(--admin-primary))] font-medium'
              : 'text-muted-foreground hover:bg-[hsl(var(--admin-border))] hover:text-foreground'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-sm">{label}</span>
        </Link>
      );
    })}
  </div>
);

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminLogout, adminUser } = useAdminAuth();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-panel flex flex-col md:flex-row">
      <aside className="w-full md:w-60 bg-[hsl(var(--admin-sidebar))] border-r border-[hsl(var(--admin-border))] flex flex-col md:min-h-screen sticky top-0 z-40">
        <div className="p-5 flex items-center gap-3 border-b border-[hsl(var(--admin-border))]">
          <div className="bg-[hsl(var(--admin-primary))] p-2 rounded-lg">
            <ShieldAlert className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Admin Portal</span>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <NavSection
            title="Overview"
            location={location}
            items={[
              { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
              { path: '/admin/users', label: 'Users', icon: Users },
              { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
              { path: '/admin/reviews', label: 'Reviews', icon: Star },
            ]}
          />
          <NavSection
            title="Departments"
            location={location}
            items={[
              { path: '/admin/dev', label: 'Engineering', icon: Code2 },
              { path: '/admin/marketing', label: 'Marketing', icon: Megaphone },
              { path: '/admin/support', label: 'Support', icon: HeadphonesIcon },
              { path: '/admin/finance', label: 'Finance', icon: DollarSign },
              { path: '/admin/invoices', label: 'Invoices', icon: FileText },
              { path: '/admin/board', label: 'Board', icon: Kanban },
            ]}
          />
        </nav>

        <div className="p-3 border-t border-[hsl(var(--admin-border))]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-[hsl(var(--admin-border))] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {adminUser?.email?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground truncate">{adminUser?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
