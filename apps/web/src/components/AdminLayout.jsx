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
    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{title}</p>
    {items.map(({ path, label, icon: Icon }) => {
      const isActive = location.pathname === path;
      return (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 text-sm ${
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
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
      <aside className="w-full md:w-56 bg-card border-r border-border flex flex-col md:min-h-screen sticky top-0 z-40">
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3 border-b border-border">
          <div className="bg-primary p-1.5 rounded-lg shrink-0">
            <ShieldAlert className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">Admin Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          <NavSection
            title="Overview"
            location={location}
            items={[
              { path: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
              { path: '/admin/analytics', label: 'Analytics',  icon: BarChart3 },
              { path: '/admin/users',     label: 'Users',      icon: Users },
              { path: '/admin/tickets',   label: 'Tickets',    icon: Ticket },
              { path: '/admin/reviews',   label: 'Reviews',    icon: Star },
            ]}
          />
          <NavSection
            title="Departments"
            location={location}
            items={[
              { path: '/admin/dev',       label: 'Engineering', icon: Code2 },
              { path: '/admin/marketing', label: 'Marketing',   icon: Megaphone },
              { path: '/admin/support',   label: 'Support',     icon: HeadphonesIcon },
              { path: '/admin/finance',   label: 'Finance',     icon: DollarSign },
              { path: '/admin/invoices',  label: 'Invoices',    icon: FileText },
              { path: '/admin/board',     label: 'Board',       icon: Kanban },
            ]}
          />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {adminUser?.email?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground truncate">{adminUser?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm rounded-xl"
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
