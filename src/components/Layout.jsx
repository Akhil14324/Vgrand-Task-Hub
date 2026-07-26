import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { Home, CheckSquare, Bell, User, LogOut, Building2, Users, AlertTriangle, X, Lock, Moon, Sun, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';
import { useChat } from '../context/ChatContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t, translating, getDynamic } = useLang();
  const { totalUnread: chatUnread } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
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

  const ROLE_AVATAR = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-indigo-100 text-indigo-700',
    user: 'bg-brand-100 text-brand-700',
  };

  const ROLE_LABEL = {
    super_admin: t('superAdmin'),
    admin: t('admin'),
    user: t('user'),
  };

  const STATUS_DOT = {
    active: 'bg-green-500',
    warned: 'bg-amber-500',
    inactive: 'bg-gray-400',
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  };

  const navItems = isAdmin
    ? [
        { to: '/admin', label: t('dashboard'), icon: Home },
        { to: '/admin/businesses', label: t('businesses'), icon: Building2 },
        { to: '/admin/tasks', label: t('tasks'), icon: CheckSquare },
        { to: '/admin/users', label: t('users'), icon: Users },
        { to: '/notifications', label: t('notifications'), icon: Bell },
        { to: '/chat', label: t('chat'), icon: MessageCircle },
        ...(user?.role === 'super_admin'
          ? [{ to: '/admin/super-users', label: t('userPasswords'), icon: Lock }]
          : []),
        { to: '/profile', label: t('profile'), icon: User },
      ]
    : [
        { to: '/dashboard', label: t('home'), icon: Home },
        { to: '/tasks', label: t('tasks'), icon: CheckSquare },
        { to: '/notifications', label: t('notifications'), icon: Bell },
        { to: '/chat', label: t('chat'), icon: MessageCircle },
        { to: '/profile', label: t('profile'), icon: User },
      ];

  const adminMoreItems = [
    { to: '/notifications', label: t('alerts'), icon: Bell },
    { to: '/chat', label: t('chat'), icon: MessageCircle },
    { to: '/profile', label: t('profile'), icon: User },
    ...(user?.role === 'super_admin'
      ? [{ to: '/admin/super-users', label: t('userPasswords'), icon: Lock }]
      : []),
  ];

  const mobileNavItems = isAdmin
    ? [
        { to: '/admin', label: t('home'), icon: Home },
        { to: '/admin/tasks', label: t('tasks'), icon: CheckSquare },
        { to: '/admin/businesses', label: t('businesses'), icon: Building2 },
        { to: '/admin/users', label: t('users'), icon: Users },
      ]
    : [
        { to: '/dashboard', label: t('home'), icon: Home },
        { to: '/tasks', label: t('tasks'), icon: CheckSquare },
        { to: '/chat', label: t('chat'), icon: MessageCircle },
        { to: '/profile', label: t('profile'), icon: User },
      ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex-col z-30 dark:bg-gray-800 dark:border-gray-700">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-brand-600">{t('appName')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
              title={t('toggleLanguage')}
              disabled={translating}
            >
              {translating ? (
                <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                lang === 'en' ? 'EN' : 'TE'
              )}
            </button>
            <button
              onClick={toggleTheme}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={t('toggleTheme')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
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
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto badge bg-red-100 text-red-700">{unreadCount}</span>
              )}
              {item.to === '/chat' && chatUnread > 0 && (
                <span className="ml-auto badge bg-brand-100 text-brand-700">{chatUnread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pt-3 pb-1 border-t border-gray-200 dark:border-gray-700">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <div className="relative flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${ROLE_AVATAR[user?.role] || ROLE_AVATAR.user}`}>
                {getInitials(user?.name)}
              </div>
              <span className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${STATUS_DOT[user?.status] || STATUS_DOT.inactive}`}></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{getDynamic(user?.name)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`badge text-[10px] leading-none ${ROLE_AVATAR[user?.role] || ROLE_AVATAR.user}`}>
                  {ROLE_LABEL[user?.role] || t('user')}
                </span>
              </div>
            </div>
          </NavLink>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
          >
            <LogOut size={20} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 dark:bg-gray-800 dark:border-gray-700">
        <span className="text-lg font-bold text-brand-600">{t('appName')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 relative"
            disabled={translating}
          >
            {translating ? (
              <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              lang === 'en' ? 'EN' : 'TE'
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`lg:ml-64 pb-20 min-h-screen ${isChat ? 'lg:pb-0' : 'lg:pb-8'}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target relative ${
                  isActive ? 'text-brand-600' : 'text-gray-400 dark:text-gray-500'
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
              {item.to === '/chat' && chatUnread > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <button
              onClick={() => setMoreMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target text-gray-400 dark:text-gray-500"
            >
              <MoreHorizontal size={22} />
              <span className="text-xs font-medium">{t('more')}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile More Menu (slide-up panel) */}
      {moreMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-50 dark:bg-gray-800 animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('more')}</span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="py-2">
              {adminMoreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={() => setMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="ml-auto badge bg-red-100 text-red-700">{unreadCount}</span>
                  )}
                  {item.to === '/chat' && chatUnread > 0 && (
                    <span className="ml-auto badge bg-brand-100 text-brand-700">{chatUnread}</span>
                  )}
                </NavLink>
              ))}
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <LogOut size={20} />
                {t('logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
