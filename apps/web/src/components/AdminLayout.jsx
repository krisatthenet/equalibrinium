import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Star, 
  BarChart3, 
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminLogout, adminUser } = useAdminAuth();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
    { path: '/admin/reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="admin-panel flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[hsl(var(--admin-sidebar))] border-r border-[hsl(var(--admin-border))] flex flex-col md:min-h-screen sticky top-0 z-40">
        <div className="p-6 flex items-center gap-3 border-b border-[hsl(var(--admin-border))]">
          <div className="bg-[hsl(var(--admin-primary))] p-2 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Admin Portal</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-[hsl(var(--admin-primary))/10] text-[hsl(var(--admin-primary))] font-medium' 
                    : 'text-muted-foreground hover:bg-[hsl(var(--admin-border))] hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--admin-border))]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-[hsl(var(--admin-border))] flex items-center justify-center text-sm font-medium">
              {adminUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{adminUser?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;