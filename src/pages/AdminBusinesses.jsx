import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

const DEFAULT_TYPES = [
  { value: 'restaurant', labelKey: 'restaurant' },
  { value: 'hospital', labelKey: 'hospital' },
  { value: 'construction', labelKey: 'construction' },
  { value: 'mines', labelKey: 'mines' },
  { value: 'it', labelKey: 'it' },
];

export default function AdminBusinesses() {
  const { t, lang, translateDynamic, getDynamic } = useLang();
  const [businesses, setBusinesses] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'restaurant', customType: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data.businesses);
    } catch (err) {
      setError(err.response?.data?.error || t('failedLoadBusinesses'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await api.get('/businesses/types');
      setBusinessTypes(res.data.types || []);
    } catch {
      setBusinessTypes([]);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    fetchTypes();
  }, []);

  // Translate user-entered business names and custom types when in Telugu
  useEffect(() => {
    if (lang !== 'te' || businesses.length === 0) return;
    const texts = [];
    businesses.forEach((biz) => {
      if (biz.name) texts.push(biz.name);
      const custom = DEFAULT_TYPES.find((dt) => dt.value === biz.type) ? null : biz.type;
      if (custom) texts.push(custom.replace(/_/g, ' '));
    });
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [businesses, lang, translateDynamic]);

  const typeOptions = [...new Set([...DEFAULT_TYPES.map((t) => t.value), ...businessTypes])];

  const getTypeLabel = (type) => {
    const found = DEFAULT_TYPES.find((dt) => dt.value === type);
    if (found) return t(found.labelKey);
    const custom = type.replace(/_/g, ' ');
    return getDynamic(custom);
  };

  const getFinalType = () => {
    if (form.type === '__custom__') {
      return form.customType.trim().toLowerCase().replace(/\s+/g, '_');
    }
    return form.type;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'restaurant', customType: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (biz) => {
    setEditing(biz);
    const isDefault = DEFAULT_TYPES.some((t) => t.value === biz.type);
    setForm({
      name: biz.name,
      type: isDefault ? biz.type : '__custom__',
      customType: isDefault ? '' : biz.type,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError(t('businessNameRequired'));
      return;
    }
    const finalType = getFinalType();
    if (!finalType) {
      setFormError(t('enterNewTypeName'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/businesses/${editing.id}`, { name: form.name, type: finalType });
      } else {
        await api.post('/businesses', { name: form.name, type: finalType });
      }
      setModalOpen(false);
      fetchBusinesses();
      fetchTypes();
    } catch (err) {
      setFormError(err.response?.data?.error || t('failedSaveBusiness'));
    } finally {
      setSaving(false);
    }
  };

  const [deleteBiz, setDeleteBiz] = useState(null);

  const handleDelete = (biz) => {
    setDeleteBiz(biz);
  };

  const confirmDeleteBiz = async () => {
    const biz = deleteBiz;
    setDeleteBiz(null);
    if (!biz) return;
    try {
      await api.delete(`/businesses/${biz.id}`);
      fetchBusinesses();
    } catch (err) {
      setError(err.response?.data?.error || t('failedDeleteBusiness'));
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('businesses')}</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} className="mr-1" />
          <span className="hidden sm:inline">{t('addBusiness')}</span>
          <span className="sm:hidden">{t('add')}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('noBusinessesYet')}</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {businesses.map((biz) => (
              <div key={biz.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{getDynamic(biz.name)}</h3>
                    <span className="badge bg-brand-100 text-brand-700 mt-1">{getTypeLabel(biz.type)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(biz)} className="touch-target flex items-center justify-center text-gray-400 hover:text-brand-600 rounded-lg p-1">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(biz)} className="touch-target flex items-center justify-center text-gray-400 hover:text-red-600 rounded-lg p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{biz.task_count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('tasks')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{biz.completed_count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('done')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{biz.pending_count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('pending')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{biz.on_hold_count || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('onHold')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-indigo-600">{biz.user_count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('users')}</p>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('business')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('type')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('tasks')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('completed')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('pending')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('onHold')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('users')}</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{getDynamic(biz.name)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-brand-100 text-brand-700">{getTypeLabel(biz.type)}</span>
                    </td>
                    <td className="text-center px-4 py-3 font-medium">{biz.task_count}</td>
                    <td className="text-center px-4 py-3"><span className="text-green-600 font-medium">{biz.completed_count}</span></td>
                    <td className="text-center px-4 py-3"><span className="text-yellow-600 font-medium">{biz.pending_count}</span></td>
                    <td className="text-center px-4 py-3"><span className="text-blue-600 font-medium">{biz.on_hold_count || 0}</span></td>
                    <td className="text-center px-4 py-3"><span className="text-indigo-600 font-medium">{biz.user_count}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(biz)} className="btn-ghost touch-target">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(biz)} className="btn-ghost touch-target text-red-500 hover:text-red-700 hover:bg-red-50">
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

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editBusiness') : t('addBusiness')}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder={t('businessNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
            >
              {typeOptions.map((topt) => (
                <option key={topt} value={topt}>{getTypeLabel(topt)}</option>
              ))}
              <option value="__custom__">+ {t('addNewType')}</option>
            </select>
          </div>
          {form.type === '__custom__' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newTypeName')}</label>
              <input
                type="text"
                value={form.customType}
                onChange={(e) => setForm({ ...form, customType: e.target.value })}
                className="input"
                placeholder={t('customTypePlaceholder')}
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? t('saving') : editing ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={deleteBiz !== null}
        title={t('delete')}
        message={deleteBiz ? t('deleteBusinessConfirm').replace('{name}', getDynamic(deleteBiz.name)) : ''}
        onConfirm={confirmDeleteBiz}
        onCancel={() => setDeleteBiz(null)}
      />
    </div>
  );
}
