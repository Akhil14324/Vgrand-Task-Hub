import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/client';
import Modal from '../components/Modal';
import { Shield, Users as UsersIcon, Key, ArrowUpCircle, ArrowDownCircle, Trash2, Crown } from 'lucide-react';

function roleBadgeClass(role) {
  if (role === 'super_admin') return 'bg-red-100 text-red-700';
  if (role === 'admin') return 'bg-purple-100 text-purple-700';
  return 'bg-blue-100 text-blue-700';
}

function UserTable({ users, title, icon: Icon, color, onOpenPwModal, onOpenRoleModal, onDeleteUser, isSuperAdminSection }) {
  const { t, lang, getDynamic } = useLang();

  const roleLabel = (role) => t(role === 'super_admin' ? 'superAdmin' : role === 'admin' ? 'admin' : 'user');

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const emptyMsg = isSuperAdminSection ? t('noSuperAdminsFound') : title === t('admins') ? t('noAdminsFound') : t('noUsersFound');

  return (
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
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMsg}</p>
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
                <div className="flex items-center justify-center gap-4 pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                  {!isSuperAdminSection && (
                    <button
                      onClick={() => onOpenPwModal(u)}
                      className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-brand-600 touch-target"
                    >
                      <Key size={16} />
                      <span>{t('changePassword')}</span>
                    </button>
                  )}
                  {!isSuperAdminSection && u.role === 'user' && (
                    <button
                      onClick={() => onOpenRoleModal(u, 'promote')}
                      className="flex flex-col items-center gap-0.5 text-xs text-green-600 hover:text-green-700 touch-target"
                    >
                      <ArrowUpCircle size={16} />
                      <span>{t('promote')}</span>
                    </button>
                  )}
                  {!isSuperAdminSection && u.role === 'admin' && (
                    <button
                      onClick={() => onOpenRoleModal(u, 'demote')}
                      className="flex flex-col items-center gap-0.5 text-xs text-red-600 hover:text-red-700 touch-target"
                    >
                      <ArrowDownCircle size={16} />
                      <span>{t('demote')}</span>
                    </button>
                  )}
                  {!isSuperAdminSection && (
                    <button
                      onClick={() => onDeleteUser(u.id, getDynamic(u.name))}
                      className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-red-600 touch-target"
                    >
                      <Trash2 size={16} />
                      <span>{t('delete')}</span>
                    </button>
                  )}
                </div>
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
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-48">{t('action')}</th>
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
                      <div className="flex items-center justify-center gap-3">
                        {!isSuperAdminSection && (
                          <button
                            onClick={() => onOpenPwModal(u)}
                            className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-brand-600 touch-target"
                          >
                            <Key size={16} />
                            <span>{t('changePassword')}</span>
                          </button>
                        )}
                        {!isSuperAdminSection && u.role === 'user' && (
                          <button
                            onClick={() => onOpenRoleModal(u, 'promote')}
                            className="flex flex-col items-center gap-0.5 text-xs text-green-600 hover:text-green-700 touch-target"
                          >
                            <ArrowUpCircle size={16} />
                            <span>{t('promote')}</span>
                          </button>
                        )}
                        {!isSuperAdminSection && u.role === 'admin' && (
                          <button
                            onClick={() => onOpenRoleModal(u, 'demote')}
                            className="flex flex-col items-center gap-0.5 text-xs text-red-600 hover:text-red-700 touch-target"
                          >
                            <ArrowDownCircle size={16} />
                            <span>{t('demote')}</span>
                          </button>
                        )}
                        {!isSuperAdminSection && (
                          <button
                            onClick={() => onDeleteUser(u.id, getDynamic(u.name))}
                            className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-red-600 touch-target"
                          >
                            <Trash2 size={16} />
                            <span>{t('delete')}</span>
                          </button>
                        )}
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
}

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

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleModalAction, setRoleModalAction] = useState(null);
  const [roleError, setRoleError] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setAllUsers(res.data?.users || []);
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
    if (!newPassword || newPassword.length < 8) {
      setPwError(t('passwordMinLengthError'));
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwError(t('passwordUppercaseError'));
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPwError(t('passwordLowercaseError'));
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwError(t('passwordNumberError'));
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

  const openRoleModal = (user, action) => {
    setRoleModalUser(user);
    setRoleModalAction(action);
    setRoleError('');
    setRoleModalOpen(true);
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!roleModalUser || !roleModalAction) return;
    setChangingRole(true);
    try {
      const newRole = roleModalAction === 'promote' ? 'admin' : 'user';
      await api.put(`/users/${roleModalUser.id}/role`, { role: newRole });
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      setRoleError(err.response?.data?.error || t('failedUpdateRole'));
    } finally {
      setChangingRole(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(t('deleteUserConfirmMsg').replace('{name}', userName))) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('failedDeleteUser'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const superAdminUsers = allUsers.filter((u) => u.role === 'super_admin');
  const adminUsers = allUsers.filter((u) => u.role === 'admin');
  const regularUsers = allUsers.filter((u) => u.role === 'user');

  const roleLabel = (role) => t(role === 'super_admin' ? 'superAdmin' : role === 'admin' ? 'admin' : 'user');

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

      <UserTable users={superAdminUsers} title={t('superAdmins')} icon={Crown} color="text-red-700" isSuperAdminSection />
      <UserTable users={adminUsers} title={t('admins')} icon={Shield} color="text-purple-700" onOpenPwModal={openPwModal} onOpenRoleModal={openRoleModal} onDeleteUser={handleDeleteUser} />
      <UserTable users={regularUsers} title={t('users')} icon={UsersIcon} color="text-blue-700" onOpenPwModal={openPwModal} onOpenRoleModal={openRoleModal} onDeleteUser={handleDeleteUser} />

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

      {/* Role Change Confirmation Modal */}
      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={roleModalAction === 'promote' ? t('promoteToAdmin') : t('demoteToUser')}
      >
        <form onSubmit={handleRoleChange} className="space-y-4">
          {roleError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {roleError}
            </div>
          )}
          {roleModalUser && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 mb-2 dark:bg-gray-700">
              <p className="font-medium text-gray-900 dark:text-gray-100">{getDynamic(roleModalUser.name)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{roleModalUser.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('currentRole')}: <span className="font-medium">{roleLabel(roleModalUser.role)}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {roleModalAction === 'promote'
              ? t('promoteDesc')
              : t('demoteDesc')}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('areYouSureContinue')}
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRoleModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button
              type="submit"
              disabled={changingRole}
              className={`flex-1 ${roleModalAction === 'promote' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {changingRole ? t('updating') : roleModalAction === 'promote' ? t('promoteToAdmin') : t('demoteToUser')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
