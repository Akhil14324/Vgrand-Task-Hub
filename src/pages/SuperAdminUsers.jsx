import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/client';
import Modal from '../components/Modal';
import { Shield, Users as UsersIcon, Lock, Key } from 'lucide-react';

export default function SuperAdminUsers() {
  const { user: currentUser } = useAuth();
  const { t, lang, translateDynamic, getDynamic } = useLang();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setAllUsers(res.users || res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || t('failedLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Translate user names when in Telugu
  useEffect(() => {
    if (lang !== 'te' || allUsers.length === 0) return;
    const texts = allUsers.map((u) => u.name).filter(Boolean);
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [allUsers, lang, translateDynamic]);

  const openPwModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setPwError('');
    setPwSuccess('');
    setPwModalOpen(true);
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!newPassword || newPassword.length < 6) {
      setPwError(t('passwordMinLengthError'));
      return;
    }
    setSavingPw(true);
    try {
      await api.put(`/users/${selectedUser.id}/password`, { new_password: newPassword });
      setPwSuccess(t('passwordUpdatedFor').replace('{name}', getDynamic(selectedUser.name)));
      setPwModalOpen(false);
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || t('failedUpdatePassword'));
    } finally {
      setSavingPw(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const adminUsers = allUsers.filter((u) => u.role === 'admin');
  const regularUsers = allUsers.filter((u) => u.role === 'user');

  const roleLabel = (role) => t(role === 'super_admin' ? 'superAdmin' : role === 'admin' ? 'admin' : 'user');

  const roleBadgeClass = (role) => {
    if (role === 'super_admin') return 'bg-red-100 text-red-700';
    if (role === 'admin') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  const UserTable = ({ users, title, icon: Icon, color }) => (
    <div className="mb-8">
      <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${color}`}>
        <Icon size={20} />
        {title}
        {users.length > 0 && (
          <span className={`badge ${roleBadgeClass(users[0]?.role)}`}>{users.length}</span>
        )}
      </h2>

      {users.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title === t('admins') ? t('noAdminsFound') : t('noUsersFound')}</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {users.map((u) => (
              <div key={u.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{getDynamic(u.name)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`badge ${roleBadgeClass(u.role)}`}>{roleLabel(u.role)}</span>
                </div>
                <button
                  onClick={() => openPwModal(u)}
                  className="btn-secondary w-full mt-2"
                >
                  <Key size={16} className="mr-1.5" />
                  {t('changePassword')}
                </button>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('username')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('email')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('role')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('joined')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-40">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{getDynamic(u.name)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${roleBadgeClass(u.role)}`}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openPwModal(u)}
                          className="btn-secondary text-sm"
                        >
                          <Key size={16} className="mr-1.5" />
                          {t('changePassword')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('allUsers')}</h1>

      {pwSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {pwSuccess}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserTable users={adminUsers} title={t('admins')} icon={Shield} color="text-purple-700" />
      <UserTable users={regularUsers} title={t('users')} icon={UsersIcon} color="text-blue-700" />

      {/* Change Password Modal */}
      <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)} title={t('changeUserPassword')}>
        <form onSubmit={handlePwSave} className="space-y-4">
          {pwError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {pwError}
            </div>
          )}
          {selectedUser && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700">
              <p className="font-medium text-gray-900 dark:text-gray-100">{getDynamic(selectedUser.name)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('role')}: <span className="font-medium">{roleLabel(selectedUser.role)}</span></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder={t('passwordMinLengthPlaceholder')}
              autoFocus
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
