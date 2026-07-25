import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/client';
import { CheckCircle, Clock, AlertTriangle, Plus, Building2, Calendar, PauseCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang, translateDynamic, getDynamic } = useLang();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.business_id) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/tasks');
        setTasks(res.data.tasks);
      } catch (err) {
        setError(err.response?.data?.error || t('failedLoadTasks'));
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  // Translate dynamic content when in Telugu
  useEffect(() => {
    if (lang !== 'te' || tasks.length === 0) return;
    const texts = [];
    tasks.forEach((task) => {
      if (task.title) texts.push(task.title);
      if (task.business_name) texts.push(task.business_name);
      if (task.created_by_name) texts.push(task.created_by_name);
    });
    if (user?.business_name) texts.push(user.business_name);
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [tasks, lang, user, translateDynamic]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user?.business_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('dashboard')}</h1>
        <div className="card text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('notAssignedYet')}</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {t('notAssignedDesc')}
          </p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const pendingTasks = tasks.filter((task) => task.status === 'pending').length;
  const onHoldTasks = tasks.filter((task) => task.status === 'on_hold').length;
  const warnedTasks = tasks.filter((task) => task.is_warned).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const recentTasks = tasks.slice(0, 5);

  const stats = [
    { label: t('totalTasks'), value: totalTasks, icon: Clock, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' },
    { label: t('completed'), value: completedTasks, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('pending'), value: pendingTasks, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('onHold'), value: onHoldTasks, icon: PauseCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('warnings'), value: warnedTasks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getDynamic(user.business_name) || t('yourBusiness')}</p>
        </div>
        <Link to="/tasks" className="btn-primary">
          <Plus size={18} className="mr-1" />
          <span className="hidden sm:inline">{t('addTask')}</span>
          <span className="sm:hidden">{t('add')}</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      {totalTasks > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('completionRate')}</h2>
            <span className="text-sm font-bold text-brand-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div className="bg-brand-600 h-3 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('recentTasks')}</h2>
        <Link to="/tasks" className="text-sm text-brand-600 font-medium hover:underline">{t('viewAll')} →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('noTasksYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTasks.map((task) => (
            <Link key={task.id} to="/tasks" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              {task.status === 'completed' ? (
                <CheckCircle size={22} className="text-green-500 flex-shrink-0" />
              ) : (
                <Clock size={22} className="text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {getDynamic(task.title)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  <span>{t('createdBy')} {getDynamic(task.created_by_name)}</span>
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
              {task.is_warned && (
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
