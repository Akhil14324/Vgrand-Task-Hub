import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CheckSquare, Bell, User, LogOut, Building2, Users, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.data.unread_count);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    window.addEventListener('notifications-updated', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', fetchUnread);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const navItems = isAdmin
    ? [
        { to: '/admin', label: 'Dashboard', icon: Home },
        { to: '/admin/businesses', label: 'Businesses', icon: Building2 },
        { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: Home },
        { to: '/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ];

  const mobileNavItems = isAdmin
    ? [
        { to: '/admin', label: 'Home', icon: Home },
        { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/notifications', label: 'Alerts', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/dashboard', label: 'Home', icon: Home },
        { to: '/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/notifications', label: 'Alerts', icon: Bell },
        { to: '/profile', label: 'Profile', icon: User },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex-col z-30">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-brand-600">TaskHub</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto badge bg-red-100 text-red-700">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <span className="text-lg font-bold text-brand-600">TaskHub</span>
        <span className="text-sm text-gray-500">{user?.name?.split(' ')[0]}</span>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-8 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target relative ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
