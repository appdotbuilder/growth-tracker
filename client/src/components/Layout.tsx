import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Target, 
  Trophy, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings, 
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
// Local type definitions to avoid build issues
type UserRole = 'Employee' | 'Manager' | 'HR_Admin' | 'System_Admin';

interface UserType {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string | null;
  manager_id: number | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
}

interface LayoutProps {
  children: React.ReactNode;
  currentUser: UserType | null;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentUser, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    ...(currentUser?.role === 'Manager' || currentUser?.role === 'HR_Admin' || currentUser?.role === 'System_Admin' 
      ? [{ id: 'team', label: 'Team Management', icon: Users }] 
      : []
    ),
    ...(currentUser?.role === 'HR_Admin' || currentUser?.role === 'System_Admin' 
      ? [
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'integrations', label: 'Integrations', icon: Settings }
        ] 
      : []
    ),
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-semibold text-slate-800">GrowthTracker</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-800">🚀 GrowthTracker</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-nav-item w-full ${
                    currentPage === item.id ? 'active' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User info */}
          {currentUser && (
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.profile_picture || undefined} />
                  <AvatarFallback>
                    {currentUser.first_name[0]}{currentUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}