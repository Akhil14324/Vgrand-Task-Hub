import { useEffect, useState, useCallback } from 'react';
import { useLang } from '../context/LanguageContext';
import api from '../api/client';
import { Bell, AlertTriangle, UserPlus, CheckSquare, CheckCheck, CheckCircle } from 'lucide-react';

const NOTIFICATION_ICONS = {
  warning: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  assignment: { icon: UserPlus, color: 'text-brand-600', bg: 'bg-brand-50' },
  task_added: { icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
  user_joined: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  task_completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
};

const NOTIFICATION_LABELS = {
  warning: 'warningNotif',
  assignment: 'assignment',
  task_added: 'newTask',
  user_joined: 'newUser',
  task_completed: 'taskCompleted',
};

export default function Notifications() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      setError(err.response?.data?.error || t('failedLoadNotifications'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(err.response?.data?.error || t('failedMarkRead'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(err.response?.data?.error || t('failedMarkAllRead'));
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return t('justNow');
    if (diffMin < 60) return `${diffMin}${t('minAgo')}`;
    if (diffHr < 24) return `${diffHr}${t('hrAgo')}`;
    if (diffDay < 7) return `${diffDay}${t('dayAgo')}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('notifications')}</h1>
          {unreadCount > 0 && (
            <span className="badge bg-red-100 text-red-700">{unreadCount} {t('new')}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-ghost text-sm">
            <CheckCheck size={16} className="mr-1" />
            <span className="hidden sm:inline">{t('markAllRead')}</span>
            <span className="sm:hidden">{t('readAll')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.task_added;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`card flex items-start gap-3 cursor-pointer transition-colors ${
                  !notif.is_read ? 'border-brand-200 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-900/10' : ''
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t(NOTIFICATION_LABELS[notif.type] || 'notification')}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(notif.created_at)}</span>
                  </div>
                  <p className={`text-sm ${notif.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
