import React, { useState } from 'react';
import { useAuth } from '@/auth/authContext';
import { useTheme } from '@/theme/themeContext';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, Settings, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AppLayoutProps {
  children: React.ReactNode;
  departmentName: string;
  /** Optional department-specific navigation rendered below the default sidebar links. */
  secondaryNav?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, departmentName, secondaryNav }) => {
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
          fixed lg:relative z-40 h-screen w-64 bg-gradient-to-b from-slate-950 via-blue-950/95 to-slate-900 text-sidebar-foreground transition-transform duration-300 flex flex-col shadow-2xl shadow-blue-950/30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
          <div className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-50/90">
            <span className="mr-2 h-2 w-2 rounded-full bg-cyan-300" />
            Operations Hub
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">JCF</h1>
          <p className="mt-1 text-xs text-blue-50/90">Central Hub</p>
        </div>

        <nav className="flex-1 overflow-auto p-3 space-y-1.5">
          <button
            onClick={() => navigate(`/departments/${user?.department}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-sm font-medium text-blue-50/90 hover:bg-white/10 hover:text-white"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-sm font-medium text-blue-50/90 hover:bg-white/10 hover:text-white"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          {secondaryNav}
        </nav>

        <div className="border-t border-white/10 p-4 bg-gradient-to-t from-blue-950/80">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent/30 transition-all text-left">
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-sidebar-accent">
                  <AvatarFallback className="text-xs font-bold bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-sidebar-foreground/70 truncate capitalize">{user?.department}</p>
                </div>
                <ChevronDown className="h-3 w-3 flex-shrink-0 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-muted-foreground truncate capitalize">{user?.department}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
