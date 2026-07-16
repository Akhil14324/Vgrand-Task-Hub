import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { UserPlus, Users as UsersIcon, Building2, Mail, Shield } from 'lucide-react';

export default function AdminUsers() {
  const [unassigned, setUnassigned] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assigning, setAssigning] = useState(false);

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
    setSelectedBusinessId(user.business_id?.toString() || '');
    setAssignError('');
    setAssignModalOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedBusinessId) {
      setAssignError('Please select a business');
      return;
    }
    setAssigning(true);
    try {
      await api.put(`/users/${selectedUser.id}/assign`, { business_id: parseInt(selectedBusinessId) });
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign user');
    } finally {
      setAssigning(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      warned: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-red-100 text-red-700',
    };
    return <span className={`badge ${colors[status] || colors.active}`}>{status}</span>;
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
                  <button onClick={() => openAssignModal(user)} className="btn-primary w-full">
                    <Building2 size={16} className="mr-1" />
                    Assign to Business
                  </button>
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
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unassigned.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openAssignModal(user)} className="btn-primary text-sm">
                          <Building2 size={16} className="mr-1" />
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* All Users Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UsersIcon size={20} className="text-gray-600" />
          All Users
        </h2>

        {/* Mobile: Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {allUsers.map((user) => (
            <div key={user.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className={`badge ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                  {statusBadge(user.status)}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="truncate">{user.business_name || 'Unassigned'}</span>
                </div>
                {user.role === 'user' && (
                  <button onClick={() => openAssignModal(user)} className="btn-ghost text-sm touch-target">
                    {user.business_id ? 'Reassign' : 'Assign'}
                  </button>
                )}
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
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Business</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.business_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3">{statusBadge(user.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {user.role === 'user' && (
                      <button onClick={() => openAssignModal(user)} className="btn-ghost text-sm touch-target">
                        {user.business_id ? 'Reassign' : 'Assign'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign User to Business">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Business</label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="input"
            >
              <option value="">Choose a business...</option>
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>{biz.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={assigning} className="btn-primary flex-1">
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
