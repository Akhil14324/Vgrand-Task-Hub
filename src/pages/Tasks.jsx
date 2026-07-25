import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import { Plus, CheckCircle, Circle, AlertTriangle, Calendar, Filter, Trash2, Pencil, Pause, Play } from 'lucide-react';

export default function Tasks() {
  const { user, refreshUser } = useAuth();
  const { t, lang, translateDynamic, getDynamic } = useLang();
  const location = useLocation();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const isAdminTasks = location.pathname.startsWith('/admin');

  const [tasks, setTasks] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queryParams = new URLSearchParams(location.search);
  const [filterBusiness, setFilterBusiness] = useState(queryParams.get('business_id') || '');
  const [filterStatus, setFilterStatus] = useState(queryParams.get('status') || '');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warnTask, setWarnTask] = useState(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [warnError, setWarnError] = useState('');
  const [warning, setWarning] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', business_id: '', assigned_user_id: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [businessUsers, setBusinessUsers] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '' });
  const [editError, setEditError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterBusiness) params.business_id = filterBusiness;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/tasks', { params });
      let fetchedTasks = res.data.tasks;
      if (filterStatus === 'warned') {
        fetchedTasks = fetchedTasks.filter((task) => task.is_warned);
      }
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err.response?.data?.error || t('failedLoadTasks'));
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

  // Translate user-entered dynamic content when in Telugu
  useEffect(() => {
    if (lang !== 'te' || tasks.length === 0) return;
    const texts = [];
    tasks.forEach((task) => {
      if (task.title) texts.push(task.title);
      if (task.description) texts.push(task.description);
      if (task.business_name) texts.push(task.business_name);
      if (task.warning_message) texts.push(task.warning_message);
      if (task.created_by_name) texts.push(task.created_by_name);
      if (task.completed_by_name) texts.push(task.completed_by_name);
    });
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [tasks, lang, translateDynamic]);

  const fetchBusinessUsers = async (bizId) => {
    if (!bizId) {
      setBusinessUsers([]);
      return;
    }
    try {
      const res = await api.get('/users');
      const assigned = (res.data.users || res.users || []).filter(
        (u) => u.business_id === parseInt(bizId) && u.role === 'user'
      );
      setBusinessUsers(assigned);
    } catch {
      setBusinessUsers([]);
    }
  };

  const openCreateModal = () => {
    const initialBiz = isAdmin ? (filterBusiness || '') : (user?.business_id?.toString() || '');
    setForm({
      title: '',
      description: '',
      due_date: '',
      business_id: initialBiz,
      assigned_user_id: '',
    });
    setFormError('');
    setBusinessUsers([]);
    if (initialBiz) fetchBusinessUsers(initialBiz);
    setCreateModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError(t('taskTitle'));
      return;
    }
    if (isAdmin && !form.business_id) {
      setFormError(t('selectBusiness'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: form.title.trim(),
        description: form.description,
        due_date: form.due_date || null,
        business_id: form.business_id ? parseInt(form.business_id) : undefined,
        assigned_user_id: form.assigned_user_id ? parseInt(form.assigned_user_id) : undefined,
      });
      setCreateModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.error || t('failedCreateTask'));
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      await fetchTasks();
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || t('failedUpdateTaskStatus'));
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm(t('deleteTaskConfirm'))) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchTasks();
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || t('failedDeleteTask'));
    }
  };

  const toggleHold = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/hold`);
      await fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToggleHold'));
    }
  };

  const openWarnModal = (task) => {
    setWarnTask(task);
    setWarnMessage('');
    setWarnError('');
    setWarnModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.title.trim()) {
      setEditError(t('taskTitle'));
      return;
    }
    setSaving(true);
    try {
      await api.put(`/tasks/${editingTask.id}`, {
        title: editForm.title.trim(),
        description: editForm.description,
        due_date: editForm.due_date || null,
      });
      setEditModalOpen(false);
      fetchTasks();
    } catch (err) {
      setEditError(err.response?.data?.error || t('failedUpdateTask'));
    } finally {
      setSaving(false);
    }
  };

  const handleWarn = async (e) => {
    e.preventDefault();
    if (!warnMessage.trim()) {
      setWarnError(t('warningMessageRequired'));
      return;
    }
    setWarning(true);
    try {
      await api.put(`/tasks/${warnTask.id}/warn`, { message: warnMessage.trim() });
      setWarnModalOpen(false);
      fetchTasks();
    } catch (err) {
      setWarnError(err.response?.data?.error || t('failedSendWarning'));
    } finally {
      setWarning(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'on_hold') return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
  };

  const getAgeClass = (task) => {
    if (!task.created_at) return 'bg-white dark:bg-gray-800';
    const hours = (Date.now() - new Date(task.created_at).getTime()) / 36e5;
    if (hours < 24) return 'bg-white dark:bg-gray-800';
    if (hours < 48) return 'bg-green-200 dark:bg-green-900/50';
    if (hours < 72) return 'bg-orange-200 dark:bg-orange-900/50';
    return 'bg-red-200 dark:bg-red-900/50';
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('tasks')}</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} className="mr-1" />
          <span className="hidden sm:inline">{t('addTask')}</span>
          <span className="sm:hidden">{t('add')}</span>
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
            <option value="">{t('allBusinesses')}</option>
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
          <option value="">{t('allStatus')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="completed">{t('completed')}</option>
          <option value="on_hold">{t('onHold')}</option>
          <option value="warned">{t('warned')}</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        !filterStatus && !filterBusiness ? (
          <div className="card text-center py-12">
            <Circle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('noTasksYetTasks')}</p>
          </div>
        ) : null
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="grid gap-3 lg:hidden">
            {tasks.map((task) => (
              <div key={task.id} className={`card ${getAgeClass(task)} ${task.is_warned ? 'border-yellow-300' : ''}`}>
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
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {getDynamic(task.title)}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{getDynamic(task.description)}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {isAdminTasks && task.business_name && (
                        <span className="badge bg-brand-100 text-brand-700">{getDynamic(task.business_name)}</span>
                      )}
                      {isAdminTasks && task.assigned_user_name && (
                        <span className="badge bg-indigo-100 text-indigo-700">{t('assigned')}: {task.assigned_user_name}</span>
                      )}
                      {task.status === 'completed' ? (
                        <span className="badge bg-green-100 text-green-700">{t('completed')}</span>
                      ) : task.status === 'on_hold' ? (
                        <span className="badge bg-blue-100 text-blue-700">{t('onHold')}</span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-700">{t('pending')}</span>
                      )}
                      {task.is_warned && !task.warning_message && (
                        <span className="badge bg-red-100 text-red-700">
                          <AlertTriangle size={12} className="mr-1" />
                          {t('warned')}
                        </span>
                      )}
                      {isOverdue(task) && (
                        <span className="badge bg-red-100 text-red-700">
                          <Calendar size={12} className="mr-1" />
                          {t('overdue')}
                        </span>
                      )}
                    </div>
                    {task.is_warned && task.warning_message && (
                      <div className="mt-2 rounded-md bg-red-50 border-l-4 border-red-500 px-3 py-2.5 shadow-sm">
                        <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                          <AlertTriangle size={12} />
                          {t('warning')}
                        </p>
                        <p className="text-sm text-red-700 mt-1 leading-relaxed">{getDynamic(task.warning_message)}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>{t('createdBy')} {getDynamic(task.created_by_name)}</span>
                      {task.due_date && <span>{t('due')}: {formatDate(task.due_date)}</span>}
                      {task.completed_by_name && <span>{t('doneBy')} {getDynamic(task.completed_by_name)}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {isAdminTasks && task.status !== 'completed' && (
                        <button
                          onClick={() => toggleHold(task.id)}
                          className={`text-sm font-medium flex items-center gap-1 ${task.status === 'on_hold' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-600 font-medium hover:text-blue-700'}`}
                        >
                          {task.status === 'on_hold' ? (
                            <>
                              <Play size={14} />
                              {t('resumeFromHold')}
                            </>
                          ) : (
                            <>
                              <Pause size={14} />
                              {t('putOnHold')}
                            </>
                          )}
                        </button>
                      )}
                      {isAdminTasks && task.status === 'pending' && (
                        <button
                          onClick={() => openWarnModal(task)}
                          className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
                        >
                          <AlertTriangle size={14} />
                          {t('sendWarning')}
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(task)}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                      >
                        <Pencil size={14} />
                        {t('editTask')}
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-sm text-gray-500 font-medium hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden lg:block card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-10"></th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('task')}</th>
                  {isAdminTasks && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('business')}</th>}
                  {isAdminTasks && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('assignedTo')}</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('status')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('dueDate')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('created')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 w-32">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className={getAgeClass(task)}>
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
                      <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {getDynamic(task.title)}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 break-words">{getDynamic(task.description)}</div>
                      )}
                      {task.is_warned && !task.warning_message && (
                        <span className="badge bg-red-100 text-red-700 mt-1">
                          <AlertTriangle size={12} className="mr-1" />
                          {t('warned')}
                        </span>
                      )}
                      {task.is_warned && task.warning_message && (
                        <div className="mt-2 rounded-md bg-red-50 border-l-4 border-red-500 px-3 py-2.5 shadow-sm">
                          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                            <AlertTriangle size={12} />
                            {t('warning')}
                          </p>
                          <p className="text-sm text-red-700 mt-1 leading-relaxed">{getDynamic(task.warning_message)}</p>
                        </div>
                      )}
                    </td>
                    {isAdminTasks && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{getDynamic(task.business_name)}</td>}
                    {isAdminTasks && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {task.assigned_user_name || <span className="text-gray-400 italic">{t('allUsersInBusiness')}</span>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {task.status === 'completed' ? (
                        <span className="badge bg-green-100 text-green-700">{t('completed')}</span>
                      ) : task.status === 'on_hold' ? (
                        <span className="badge bg-blue-100 text-blue-700">{t('onHold')}</span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-700">{t('pending')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {task.due_date ? (
                        <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.due_date)}
                          {isOverdue(task) && ` (${t('overdue')})`}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{getDynamic(task.created_by_name)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {isAdminTasks && task.status !== 'completed' && (
                          <button
                            onClick={() => toggleHold(task.id)}
                            className="btn-ghost touch-target text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title={task.status === 'on_hold' ? t('resumeFromHold') : t('putOnHold')}
                          >
                            {task.status === 'on_hold' ? <Play size={16} /> : <Pause size={16} />}
                          </button>
                        )}
                        {isAdminTasks && task.status === 'pending' && (
                          <button
                            onClick={() => openWarnModal(task)}
                            className="btn-ghost touch-target text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('sendWarning')}
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(task)}
                          className="btn-ghost touch-target text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={t('editTask')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="btn-ghost touch-target text-gray-500 hover:text-red-600 hover:bg-red-50"
                          title={t('delete')}
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

      {/* Create Task Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('addTask')}>
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('business')}</label>
              <select
                value={form.business_id}
                onChange={(e) => {
                  const bizId = e.target.value;
                  setForm({ ...form, business_id: bizId });
                  fetchBusinessUsers(bizId);
                }}
                className="input"
              >
                <option value="">{t('selectBusinessPlaceholder')}</option>
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>{biz.name}</option>
                ))}
              </select>
            </div>
          )}
          {isAdmin && form.business_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('assignedUsers')} ({businessUsers.length})
              </label>
              {businessUsers.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('noUsersAssigned')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {businessUsers.map((u) => (
                    <span key={u.id} className="badge bg-blue-100 text-blue-700">
                      {u.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {isAdmin && form.business_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('assignToUser')} <span className="text-gray-400 font-normal">({t('optional')})</span>
              </label>
              <select
                value={form.assigned_user_id}
                onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                className="input"
              >
                <option value="">{t('allUsersInBusiness')}</option>
                {businessUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {form.assigned_user_id && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('onlySelectedUser')}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder={t('taskTitlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={3}
              placeholder={t('optionalDetails')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dueDate')}</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? t('creating') : t('createTask')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Warn Modal */}
      <Modal open={warnModalOpen} onClose={() => setWarnModalOpen(false)} title={t('sendWarning')}>
        <form onSubmit={handleWarn} className="space-y-4">
          {warnError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {warnError}
            </div>
          )}
          {warnTask && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700">
              <p className="font-medium text-gray-900 dark:text-gray-100">{getDynamic(warnTask.title)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('createdBy')} {getDynamic(warnTask.created_by_name)}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('warningMessage')}</label>
            <textarea
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              className="input"
              rows={4}
              placeholder={t('warningPlaceholder')}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setWarnModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={warning} className="btn-danger flex-1">
              <AlertTriangle size={16} className="mr-1" />
              {warning ? t('sending') : t('sendWarning')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={t('editTask')}>
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('title')}</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="input"
              placeholder={t('taskTitlePlaceholder')}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input"
              rows={3}
              placeholder={t('optionalDetails')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dueDate')}</label>
            <input
              type="date"
              value={editForm.due_date}
              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? t('saving') : t('updateTask')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
