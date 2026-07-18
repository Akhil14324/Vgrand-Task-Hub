import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import {
  LogOut, Building2, Mail, Shield, ShieldAlert, ShieldOff, User as UserIcon,
  CheckCircle2, Clock, AlertTriangle, Calendar, Pencil, Lock, TrendingUp,
} from 'lucide-react';

const ROLE_AVATAR = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-indigo-100 text-indigo-700',
  user: 'bg-brand-100 text-brand-600',
};

const ROLE_BADGE = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-indigo-100 text-indigo-700',
  user: 'bg-blue-100 text-blue-700',
};

const ROLE_LABEL = {
  super_admin: 'superAdmin',
  admin: 'admin',
  user: 'user',
};

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  warned: 'bg-amber-100 text-amber-700',
  inactive: 'bg-gray-100 text-gray-600',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-gray-200 mb-2" />
          <div className="h-7 bg-gray-200 rounded w-16 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        api.get('/users/me/stats'),
        api.get('/users/me/businesses'),
        api.get('/users/me/warnings'),
      ]);
      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setBusinesses(results[1].value.data.businesses || []);
      if (results[2].status === 'fulfilled') setWarnings(results[2].value.data.warnings || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditError('');
    setEditSuccess('');
    setEditModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError(t('nameRequired'));
      return;
    }
    setSavingName(true);
    try {
      await api.put('/users/me', { name: trimmed });
      await refreshUser();
      setEditSuccess(t('profileUpdated'));
      setEditModalOpen(false);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      setEditError(err.response?.data?.error || t('failedUpdateProfile'));
    } finally {
      setSavingName(false);
    }
  };

  const openPwModal = () => {
    setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    setPwError('');
    setPwSuccess('');
    setPwModalOpen(true);
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!pwForm.current_password || !pwForm.new_password) {
      setPwError(t('allFieldsRequired'));
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError(t('passwordMinLength'));
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError(t('passwordsDoNotMatch'));
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/users/me/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(t('passwordUpdated'));
      setPwModalOpen(false);
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || t('failedUpdatePassword'));
    } finally {
      setSavingPw(false);
    }
  };

  const avatarClass = ROLE_AVATAR[user?.role] || ROLE_AVATAR.user;
  const roleBadgeClass = ROLE_BADGE[user?.role] || ROLE_BADGE.user;
  const roleLabel = t(ROLE_LABEL[user?.role] || 'user');
  const statusBadgeClass = STATUS_BADGE[user?.status] || STATUS_BADGE.active;

  const userStats = [
    { label: t('tasksCompleted'), value: stats?.tasks_completed ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('tasksPending'), value: stats?.tasks_pending ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('completionRate'), value: `${stats?.completion_rate ?? 0}%`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: t('warnings'), value: stats?.warnings_count ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const adminStats = [
    { label: t('businesses'), value: stats?.businesses_count ?? 0, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: t('users'), value: stats?.total_users ?? 0, icon: UserIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('totalTasks'), value: stats?.total_tasks ?? 0, icon: CheckCircle2, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' },
  ];

  const statTiles = isAdmin ? adminStats : userStats;
  const showWarnings = !isAdmin || (stats?.warnings_count ?? 0) > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonStats />
        <div className="card animate-pulse h-32" />
        <div className="card animate-pulse h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${avatarClass}`}>
            <span className="text-2xl font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={`badge ${roleBadgeClass} flex items-center gap-1`} title={`${roleLabel} account`}>
                {user?.role === 'super_admin' ? (
                  <ShieldAlert size={12} />
                ) : user?.role === 'admin' ? (
                  <Shield size={12} />
                ) : (
                  <UserIcon size={12} />
                )}
                {roleLabel}
              </span>
              {user?.status === 'warned' ? (
                <button
                  type="button"
                  className={`badge ${statusBadgeClass} flex items-center gap-1 capitalize hover:opacity-80 cursor-pointer`}
                  title="Click to view your warnings"
                  onClick={() => document.getElementById('warnings-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <span className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-amber-400 animate-ping opacity-75"></span>
                    <AlertTriangle size={12} className="relative" />
                  </span>
                  {user?.status}
                </button>
              ) : (
                <span
                  className={`badge ${statusBadgeClass} capitalize flex items-center gap-1 ${user?.status === 'inactive' ? 'opacity-75' : ''}`}
                  title={user?.status === 'inactive' ? 'Account is currently inactive' : 'Account is in good standing'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.status === 'inactive' ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                  {user?.status || 'active'}
                </span>
              )}
            </div>
          </div>
          <button onClick={openEditModal} className="btn-secondary">
            <Pencil size={16} className="mr-1.5" />
            {t('editProfile')}
          </button>
        </div>
        {editSuccess && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            {editSuccess}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statTiles.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Businesses Card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={18} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('assignedBusinesses')}</h3>
        </div>
        {businesses.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{t('notAssignedToBusiness')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {businesses.map((biz) => (
              <span key={biz.id} className="badge bg-brand-100 text-brand-700">
                <Building2 size={12} className="mr-1" />
                {biz.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Account Details Card */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('accountDetails')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{t('email')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{t('memberSince')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(user?.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{t('role')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <UserIcon size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{t('statusLabel')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{user?.status || 'active'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gray-400" />
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('security')}</h3>
              <p className="text-xs text-gray-400">{t('changePassword')}</p>
            </div>
          </div>
          <button onClick={openPwModal} className="btn-secondary">
            <Lock size={16} className="mr-1.5" />
            {t('changePassword')}
          </button>
        </div>
        {pwSuccess && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            {pwSuccess}
          </div>
        )}
      </div>

      {/* Warnings History Card */}
      {showWarnings && (
        <div className="card" id="warnings-history">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('warningsHistory')}</h3>
          </div>
          {warnings.length === 0 ? (
            <p className="text-sm text-gray-400 italic">{t('noWarnings')}</p>
          ) : (
            <div className="space-y-2">
              {warnings.map((w) => (
                <div key={w.id} className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{w.task_title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(w.created_at)}</span>
                  </div>
                  <p className="text-sm text-amber-800 mt-1">{w.message}</p>
                  {w.sent_by_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('sentBy')} {w.sent_by_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('dangerZone')}</h3>
        <button onClick={handleLogout} className="btn-danger w-full sm:w-auto">
          <LogOut size={18} className="mr-2" />
          {t('logout')}
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={t('editProfile')}>
        <form onSubmit={handleEditSave} className="space-y-4">
          {editError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              placeholder="Your name"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={savingName} className="btn-primary flex-1">
              {savingName ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)} title={t('changePassword')}>
        <form onSubmit={handlePwSave} className="space-y-4">
          {pwError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {pwError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('currentPassword')}</label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="input"
              placeholder={t('enterCurrentPassword')}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPassword')}</label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmNewPassword')}</label>
            <input
              type="password"
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              className="input"
              placeholder={t('reenterNewPassword')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPwModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={savingPw} className="btn-primary flex-1">
              {savingPw ? t('updating') : t('updatePassword')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
