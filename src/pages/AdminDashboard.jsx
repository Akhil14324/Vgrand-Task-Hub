import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Building2, CheckCircle, Clock, AlertTriangle, Users, TrendingUp, Plus } from 'lucide-react';

const DEFAULT_TYPE_LABELS = {
  restaurant: 'Restaurant',
  hospital: 'Hospital',
  construction: 'Construction',
  mines: 'Mines',
  it: 'IT',
};

const getTypeLabel = (type) => DEFAULT_TYPE_LABELS[type] || type.replace(/_/g, ' ');

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, usersRes] = await Promise.all([
          api.get('/businesses'),
          api.get('/users/unassigned'),
        ]);
        setBusinesses(bizRes.data.businesses);
        setUnassignedCount(usersRes.data.users.length);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const totalTasks = businesses.reduce((sum, b) => sum + parseInt(b.task_count), 0);
  const totalCompleted = businesses.reduce((sum, b) => sum + parseInt(b.completed_count), 0);
  const totalPending = businesses.reduce((sum, b) => sum + parseInt(b.pending_count), 0);
  const totalWarned = businesses.reduce((sum, b) => sum + parseInt(b.warned_count), 0);
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const stats = [
    { label: 'Businesses', value: businesses.length, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total Tasks', value: totalTasks, icon: TrendingUp, color: 'text-gray-700', bg: 'bg-gray-100' },
    { label: 'Completed', value: totalCompleted, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: totalPending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Warned', value: totalWarned, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Unassigned Users', value: unassignedCount, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

      {/* Completion Rate Bar */}
      {totalTasks > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">Overall Completion Rate</h2>
            <span className="text-sm font-bold text-brand-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-brand-600 h-3 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {totalCompleted} of {totalTasks} tasks completed across all businesses
          </p>
        </div>
      )}

      {/* Business Overview */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Business Overview</h2>
        <Link to="/admin/businesses" className="text-sm text-brand-600 font-medium hover:underline">
          Manage →
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No businesses yet.</p>
          <Link to="/admin/businesses" className="btn-primary inline-flex">
            <Plus size={18} className="mr-1" />
            Add Business
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {businesses.map((biz) => {
              const rate = biz.task_count > 0 ? Math.round((biz.completed_count / biz.task_count) * 100) : 0;
              return (
                <Link key={biz.id} to={`/admin/tasks?business_id=${biz.id}`} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{biz.name}</h3>
                      <span className="badge bg-brand-100 text-brand-700 mt-1">{getTypeLabel(biz.type)}</span>
                    </div>
                    {parseInt(biz.warned_count) > 0 && (
                      <span className="badge bg-red-100 text-red-700">
                        <AlertTriangle size={12} className="mr-1" />
                        {biz.warned_count}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <p className="text-lg font-bold">{biz.task_count}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{biz.completed_count}</p>
                      <p className="text-xs text-gray-500">Done</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-600">{biz.pending_count}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rate}% complete · {biz.user_count} users</p>
                </Link>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Business</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Tasks</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Completed</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Pending</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Warned</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Users</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {businesses.map((biz) => {
                  const rate = biz.task_count > 0 ? Math.round((biz.completed_count / biz.task_count) * 100) : 0;
                  return (
                    <tr key={biz.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/admin/tasks?business_id=${biz.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                          {biz.name}
                        </Link>
                        <div className="text-sm text-gray-500">{getTypeLabel(biz.type)}</div>
                      </td>
                      <td className="text-center px-4 py-3 font-medium">{biz.task_count}</td>
                      <td className="text-center px-4 py-3"><span className="text-green-600 font-medium">{biz.completed_count}</span></td>
                      <td className="text-center px-4 py-3"><span className="text-yellow-600 font-medium">{biz.pending_count}</span></td>
                      <td className="text-center px-4 py-3">
                        {parseInt(biz.warned_count) > 0 ? (
                          <span className="text-red-600 font-medium">{biz.warned_count}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3 text-blue-600 font-medium">{biz.user_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        <Link to="/admin/businesses" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <Building2 size={24} className="text-brand-600" />
          <span className="text-sm font-medium">Manage Businesses</span>
        </Link>
        <Link to="/admin/tasks" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <CheckCircle size={24} className="text-green-600" />
          <span className="text-sm font-medium">View All Tasks</span>
        </Link>
        <Link to="/admin/users" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <Users size={24} className="text-purple-600" />
          <span className="text-sm font-medium">Manage Users</span>
        </Link>
        <Link to="/notifications" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <AlertTriangle size={24} className="text-yellow-600" />
          <span className="text-sm font-medium">Notifications</span>
        </Link>
      </div>
    </div>
  );
}
