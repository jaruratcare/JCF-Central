import React, { useState } from 'react';
import { useAuth } from '@/auth/authContext';
import { useTheme } from '@/theme/themeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Home, Settings } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  departmentName: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, departmentName }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-40 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold">JCF</h1>
          <p className="text-xs opacity-80 mt-1">Central Hub</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => navigate(`/departments/${user?.department}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left hover:bg-sidebar-accent"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left hover:bg-sidebar-accent"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-6 space-y-3 border-t border-sidebar-border">
          <div className="text-xs opacity-80">
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="opacity-70 capitalize">{user?.department}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground hover:opacity-90"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className="shadow-sm bg-card border-b border-border">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors hover:bg-muted"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h2 className="text-xl font-bold capitalize">
                {departmentName}
              </h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
