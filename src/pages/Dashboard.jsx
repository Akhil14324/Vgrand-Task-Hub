import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { CheckCircle, Clock, AlertTriangle, Plus, Building2, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
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
        setError(err.response?.data?.error || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

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
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="card text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-semibold mb-2">Not Assigned Yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            You haven't been assigned to a business yet. Please wait for an admin to assign you to a business.
          </p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const warnedTasks = tasks.filter((t) => t.is_warned).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const recentTasks = tasks.slice(0, 5);

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: Clock, color: 'text-gray-700', bg: 'bg-gray-100' },
    { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: pendingTasks, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Warnings', value: warnedTasks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{user.business_name || 'Your Business'}</p>
        </div>
        <Link to="/tasks" className="btn-primary">
          <Plus size={18} className="mr-1" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      {totalTasks > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">Completion Rate</h2>
            <span className="text-sm font-bold text-brand-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-brand-600 h-3 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Tasks</h2>
        <Link to="/tasks" className="text-sm text-brand-600 font-medium hover:underline">View All →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tasks yet. Click "Add Task" to create one.</p>
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
                <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>By {task.created_by_name}</span>
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
