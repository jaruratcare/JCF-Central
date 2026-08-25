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

  const isCarcinome = (departmentName || '').toLowerCase().includes('carcinome');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 z-40 h-screen w-64 flex-shrink-0 transition-transform duration-300 flex flex-col shadow-md border-r
          ${isCarcinome ? 'bg-sky-100/90 text-slate-900 border-sky-300/80' : 'bg-card text-card-foreground border-border'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className={`p-6 border-b ${isCarcinome ? 'border-sky-300/80 bg-sky-200/80' : 'border-border bg-card'}`}>
          <h1 className={`mt-3 text-2xl font-bold ${isCarcinome ? 'text-blue-950' : 'text-foreground'}`}>JCF</h1>
          <p className={`mt-1 text-xs font-medium ${isCarcinome ? 'text-blue-800/80' : 'text-muted-foreground'}`}>Central Hub</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col justify-between">
          <div className="space-y-1.5 flex-1">
            {!secondaryNav && (
              <button
                onClick={() => navigate(`/departments/${user?.department}`)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent transition-all text-left text-sm font-medium ${
                  isCarcinome
                    ? 'text-slate-800 hover:bg-sky-200/70 hover:text-blue-950'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Home className={`w-4 h-4 ${isCarcinome ? 'text-slate-600' : 'text-muted-foreground'}`} />
                <span>Dashboard</span>
              </button>
            )}

            {secondaryNav}
          </div>

          <div className={`pt-3 mt-auto border-t space-y-1 ${isCarcinome ? 'border-sky-300/70' : 'border-border'}`}>
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent transition-all text-left text-sm font-medium ${
                isCarcinome
                  ? 'text-slate-800 hover:bg-sky-200/70 hover:text-blue-950'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Settings className={`w-4 h-4 ${isCarcinome ? 'text-slate-600' : 'text-muted-foreground'}`} />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className={`border-t p-4 ${isCarcinome ? 'border-sky-300/80 bg-sky-200/70' : 'border-border bg-card'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-all text-left ${
                isCarcinome ? 'hover:bg-sky-300/50' : 'hover:bg-accent'
              }`}>
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-blue-500/50">
                  <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-xs font-bold truncate ${isCarcinome ? 'text-slate-900' : 'text-foreground'}`}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={`text-[10px] truncate capitalize font-medium ${isCarcinome ? 'text-blue-900/80' : 'text-muted-foreground'}`}>
                    {user?.department}
                  </p>
                </div>
                <ChevronDown className={`h-3 w-3 flex-shrink-0 ${isCarcinome ? 'text-slate-600' : 'text-muted-foreground'}`} />
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
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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
