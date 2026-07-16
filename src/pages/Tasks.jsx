import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Circle, AlertTriangle, Calendar, Filter } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isAdminTasks = location.pathname.startsWith('/admin');

  const [tasks, setTasks] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBusiness, setFilterBusiness] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warnTask, setWarnTask] = useState(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [warnError, setWarnError] = useState('');
  const [warning, setWarning] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', business_id: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterBusiness) params.business_id = filterBusiness;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filterBusiness, filterStatus]);

  const fetchBusinesses = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data.businesses);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchBusinesses();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setForm({
      title: '',
      description: '',
      due_date: '',
      business_id: isAdmin ? (filterBusiness || '') : (user?.business_id?.toString() || ''),
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (isAdmin && !form.business_id) {
      setFormError('Please select a business');
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: form.title.trim(),
        description: form.description,
        due_date: form.due_date || null,
        business_id: form.business_id ? parseInt(form.business_id) : undefined,
      });
      setCreateModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const openWarnModal = (task) => {
    setWarnTask(task);
    setWarnMessage('');
    setWarnError('');
    setWarnModalOpen(true);
  };

  const handleWarn = async (e) => {
    e.preventDefault();
    if (!warnMessage.trim()) {
      setWarnError('Warning message is required');
      return;
    }
    setWarning(true);
    try {
      await api.put(`/tasks/${warnTask.id}/warn`, { message: warnMessage.trim() });
      setWarnModalOpen(false);
      fetchTasks();
    } catch (err) {
      setWarnError(err.response?.data?.error || 'Failed to send warning');
    } finally {
      setWarning(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} className="mr-1" />
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {isAdmin && (
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className="input sm:w-auto"
          >
            <option value="">All Businesses</option>
            {businesses.map((biz) => (
              <option key={biz.id} value={biz.id}>{biz.name}</option>
            ))}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input sm:w-auto"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <Circle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tasks yet. Click "Add Task" to create one.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="grid gap-3 lg:hidden">
            {tasks.map((task) => (
              <div key={task.id} className={`card ${task.is_warned ? 'border-yellow-300' : ''}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="touch-target flex items-center justify-center mt-0.5 flex-shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle size={24} className="text-green-500" />
                    ) : (
                      <Circle size={24} className="text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {isAdminTasks && task.business_name && (
                        <span className="badge bg-brand-100 text-brand-700">{task.business_name}</span>
                      )}
                      {task.status === 'completed' ? (
                        <span className="badge bg-green-100 text-green-700">Completed</span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                      {task.is_warned && (
                        <span className="badge bg-red-100 text-red-700">
                          <AlertTriangle size={12} className="mr-1" />
                          Warned
                        </span>
                      )}
                      {isOverdue(task) && (
                        <span className="badge bg-red-100 text-red-700">
                          <Calendar size={12} className="mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>By {task.created_by_name}</span>
                      {task.due_date && <span>Due: {formatDate(task.due_date)}</span>}
                      {task.completed_by_name && <span>Done by {task.completed_by_name}</span>}
                    </div>
                    {isAdminTasks && task.status === 'pending' && (
                      <button
                        onClick={() => openWarnModal(task)}
                        className="mt-3 text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
                      >
                        <AlertTriangle size={14} />
                        Send Warning
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden lg:block card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 w-10"></th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Task</th>
                  {isAdminTasks && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Business</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Due Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created By</th>
                  {isAdminTasks && <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-gray-50 ${task.is_warned ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="touch-target flex items-center justify-center"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle size={22} className="text-green-500" />
                        ) : (
                          <Circle size={22} className="text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                      )}
                      {task.is_warned && (
                        <span className="badge bg-red-100 text-red-700 mt-1">
                          <AlertTriangle size={12} className="mr-1" />
                          Warned
                        </span>
                      )}
                    </td>
                    {isAdminTasks && <td className="px-4 py-3 text-gray-600">{task.business_name}</td>}
                    <td className="px-4 py-3">
                      {task.status === 'completed' ? (
                        <span className="badge bg-green-100 text-green-700">Completed</span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.due_date ? (
                        <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.due_date)}
                          {isOverdue(task) && ' (Overdue)'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{task.created_by_name}</td>
                    {isAdminTasks && (
                      <td className="px-4 py-3 text-right">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => openWarnModal(task)}
                            className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1 ml-auto"
                          >
                            <AlertTriangle size={14} />
                            Warn
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Task Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Task">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
              <select
                value={form.business_id}
                onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                className="input"
              >
                <option value="">Select a business...</option>
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>{biz.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g. Clean the kitchen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Optional details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Warn Modal */}
      <Modal open={warnModalOpen} onClose={() => setWarnModalOpen(false)} title="Send Warning">
        <form onSubmit={handleWarn} className="space-y-4">
          {warnError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {warnError}
            </div>
          )}
          {warnTask && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="font-medium text-gray-900">{warnTask.title}</p>
              <p className="text-sm text-gray-500">Created by {warnTask.created_by_name}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warning Message</label>
            <textarea
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              className="input"
              rows={4}
              placeholder="e.g. This task is overdue. Please complete it immediately."
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setWarnModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={warning} className="btn-danger flex-1">
              <AlertTriangle size={16} className="mr-1" />
              {warning ? 'Sending...' : 'Send Warning'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
