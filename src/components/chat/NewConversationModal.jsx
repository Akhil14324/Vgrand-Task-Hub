import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Search, Check, Users, User } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function NewConversationModal({ open, onClose, onCreate }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [chatType, setChatType] = useState('direct');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  useEffect(() => {
    if (!open) return;
    fetchUsers();
    setSelected([]);
    setSearch('');
    setChatType('direct');
    setGroupName('');
    setError('');
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const allUsers = (res.data.users || res.data || []).filter((u) => u.id !== user.id);
      setUsers(allUsers);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (userId) => {
    setSelected((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (chatType === 'direct' && prev.length >= 1) return [userId];
      return [...prev, userId];
    });
  };

  const handleCreate = async () => {
    if (selected.length === 0) {
      setError('Select at least one user');
      return;
    }
    if (chatType === 'group' && !groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (chatType === 'group' && selected.length < 2) {
      setError('Group chat needs at least 2 other participants');
      return;
    }
    try {
      await onCreate(chatType, selected, groupName.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create conversation');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Conversation">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setChatType('direct'); setSelected([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              chatType === 'direct'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <User size={16} />
            Direct
          </button>
          <button
            onClick={() => { setChatType('group'); setSelected([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              chatType === 'group'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Users size={16} />
            Group
          </button>
        </div>

        {chatType === 'group' && (
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading ? (
            <div className="text-center text-sm text-gray-400 py-4">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-4">No users found</div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => toggleSelect(u.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                  selected.includes(u.id)
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                {selected.includes(u.id) && (
                  <Check size={18} className="text-brand-600 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selected.length === 0}
            className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chatType === 'group' ? 'Create Group' : 'Start Chat'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
