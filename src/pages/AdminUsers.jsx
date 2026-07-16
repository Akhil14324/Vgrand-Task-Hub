import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users as UsersIcon, Building2, Mail, Shield, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil } from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [unassigned, setUnassigned] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState([]);
  const [assignError, setAssignError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleModalAction, setRoleModalAction] = useState(null);
  const [roleError, setRoleError] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unassignedRes, usersRes, bizRes] = await Promise.all([
        api.get('/users/unassigned'),
        api.get('/users'),
        api.get('/businesses'),
      ]);
      setUnassigned(unassignedRes.data.users);
      setAllUsers(usersRes.users || usersRes.data.users);
      setBusinesses(bizRes.data.businesses);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedBusinessIds(user.businesses?.map((b) => b.id) || []);
    setAssignError('');
    setAssignModalOpen(true);
  };

  const toggleBusinessSelection = (bizId) => {
    setSelectedBusinessIds((prev) =>
      prev.includes(bizId)
        ? prev.filter((id) => id !== bizId)
        : [...prev, bizId]
    );
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAssigning(true);
    try {
      await api.put(`/users/${selectedUser.id}/assign`, { business_ids: selectedBusinessIds });
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign user');
    } finally {
      setAssigning(false);
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
      fetchData();
    } catch (err) {
      setRoleError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const roleBadgeClass = (role) => {
    if (role === 'super_admin') return 'bg-red-100 text-red-700';
    if (role === 'admin') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  const statusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      warned: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-red-100 text-red-700',
    };
    return <span className={`badge ${colors[status] || colors.active}`}>{status}</span>;
  };

  const adminUsers = allUsers.filter((u) => u.role === 'admin');
  const regularUsers = allUsers.filter((u) => u.role === 'user');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Unassigned Users Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UserPlus size={20} className="text-brand-600" />
          Unassigned Users
          {unassigned.length > 0 && (
            <span className="badge bg-brand-100 text-brand-700">{unassigned.length}</span>
          )}
        </h2>

        {unassigned.length === 0 ? (
          <div className="card text-center py-8">
            <UsersIcon size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No unassigned users. All users are assigned to a business.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {unassigned.map((user) => (
                <div key={user.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {statusBadge(user.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openAssignModal(user)} className="btn-primary flex-1">
                      <Building2 size={16} className="mr-1" />
                      Assign to Business
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="btn-ghost touch-target text-gray-500 hover:text-red-600 hover:bg-red-50"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unassigned.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openAssignModal(user)} className="btn-primary text-sm">
                            <Building2 size={16} className="mr-1" />
                            Assign
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="btn-ghost touch-target text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
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

      {/* Admins Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield size={20} className="text-purple-600" />
          Admins
          {adminUsers.length > 0 && (
            <span className="badge bg-purple-100 text-purple-700">{adminUsers.length}</span>
          )}
        </h2>

        {adminUsers.length === 0 ? (
          <div className="card text-center py-8">
            <Shield size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No admin users.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {adminUsers.map((user) => (
                <div key={user.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className={`badge ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                      {statusBadge(user.status)}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center justify-center gap-4 pt-2 mt-2 border-t border-gray-100">
                      <button onClick={() => openRoleModal(user, 'demote')} className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-brand-600 touch-target">
                        <ArrowDownCircle size={16} />
                        <span>Demote</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-red-600 touch-target"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${roleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {isSuperAdmin && (
                            <button onClick={() => openRoleModal(user, 'demote')} className="text-sm text-gray-600 font-medium hover:underline touch-target">
                              <ArrowDownCircle size={14} className="inline mr-1" />
                              Demote
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="btn-ghost touch-target text-gray-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete Admin"
                            >
                              <Trash2 size={16} />
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

      {/* Regular Users Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UsersIcon size={20} className="text-gray-600" />
          Users
          {regularUsers.length > 0 && (
            <span className="badge bg-blue-100 text-blue-700">{regularUsers.length}</span>
          )}
        </h2>

        {regularUsers.length === 0 ? (
          <div className="card text-center py-8">
            <UsersIcon size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No regular users.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {regularUsers.map((user) => (
                <div key={user.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className={`badge ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                      {statusBadge(user.status)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                      <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{user.businesses?.map((b) => b.name).join(', ') || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
                      <button onClick={() => openAssignModal(user)} className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-brand-600 touch-target">
                        <Pencil size={16} />
                        <span>{user.business_id ? 'Reassign' : 'Assign'}</span>
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => openRoleModal(user, 'promote')} className="flex flex-col items-center gap-0.5 text-xs text-purple-600 hover:text-purple-700 touch-target">
                          <ArrowUpCircle size={16} />
                          <span>Promote</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-red-600 touch-target"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Business</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {regularUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600">{user.businesses?.map((b) => b.name).join(', ') || <span className="text-gray-400 italic">Unassigned</span>}</td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openAssignModal(user)} className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-brand-600 touch-target">
                            <Pencil size={16} />
                            <span>{user.business_id ? 'Reassign' : 'Assign'}</span>
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => openRoleModal(user, 'promote')} className="flex flex-col items-center gap-0.5 text-xs text-purple-600 hover:text-purple-700 touch-target">
                              <ArrowUpCircle size={16} />
                              <span>Promote</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-red-600 touch-target"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
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

      {/* Assign Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign User to Businesses">
        <form onSubmit={handleAssign} className="space-y-4">
          {assignError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {assignError}
            </div>
          )}
          {selectedUser && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 mb-2">
              <p className="font-medium text-gray-900">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Businesses (multiple allowed)</label>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-3">
              {businesses.map((biz) => (
                <label key={biz.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedBusinessIds.includes(biz.id)}
                    onChange={() => toggleBusinessSelection(biz.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">{biz.name}</span>
                </label>
              ))}
            </div>
            {selectedBusinessIds.length > 0 ? (
              <p className="text-xs text-gray-500 mt-1.5">{selectedBusinessIds.length} business{selectedBusinessIds.length > 1 ? 'es' : ''} selected</p>
            ) : (
              <p className="text-xs text-amber-600 mt-1.5">No businesses selected — user will be unassigned</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={assigning} className="btn-primary flex-1">
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Change Confirmation Modal */}
      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={roleModalAction === 'promote' ? 'Promote to Admin' : 'Demote to User'}
      >
        <form onSubmit={handleRoleChange} className="space-y-4">
          {roleError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {roleError}
            </div>
          )}
          {roleModalUser && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 mb-2">
              <p className="font-medium text-gray-900">{roleModalUser.name}</p>
              <p className="text-sm text-gray-500">{roleModalUser.email}</p>
              <p className="text-sm text-gray-600 mt-1">
                Current role: <span className="font-medium">{roleModalUser.role}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600">
            {roleModalAction === 'promote'
              ? 'This will promote the user to admin, granting them access to the admin dashboard and all admin features.'
              : 'This will demote the admin back to a regular user. They will lose access to the admin dashboard.'}
          </p>
          <p className="text-sm font-medium text-gray-700">
            Are you sure you want to continue?
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRoleModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={changingRole}
              className={`flex-1 ${roleModalAction === 'promote' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {changingRole ? 'Updating...' : roleModalAction === 'promote' ? 'Promote to Admin' : 'Demote to User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
