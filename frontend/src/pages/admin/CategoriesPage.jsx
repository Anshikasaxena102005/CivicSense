import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { adminAPI } from '../../api/adminAPI';

const BLANK = { name: '', description: '', department_id: '', is_active: 1 };

export default function CategoriesPage() {
  const [cats,     setCats]     = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(BLANK);
  const [editId,   setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errors,   setErrors]   = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([adminAPI.getCategories(), adminAPI.getDepartments()]);
      setCats(c.data || []);
      setDepts(d.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setErrors({}); setShowForm(true); };
  const openEdit   = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', department_id: cat.department_id || '', is_active: cat.is_active });
    setEditId(cat.id);
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form, department_id: form.department_id || null };
      if (editId) {
        await adminAPI.updateCategory(editId, payload);
        toast.success('Category updated');
      } else {
        await adminAPI.createCategory(payload);
        toast.success('Category created');
      }
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteCategory(deleteId);
      toast.success('Category deleted');
      setDeleteId(null);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-subtitle">Manage issue categories</p>
          </div>
          <button onClick={openCreate} className="btn-primary gap-2">
            <FiPlus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {loading ? <LoadingSpinner className="mt-20" /> : cats.length === 0 ? (
          <EmptyState title="No categories" message="Create your first category." />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Description</th>
                  <th>Issues</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    <td className="text-gray-400 text-xs">{c.id}</td>
                    <td className="font-medium text-gray-900">{c.name}</td>
                    <td className="text-gray-500 text-sm">{c.department_name || '—'}</td>
                    <td className="text-gray-500 text-sm max-w-xs truncate">{c.description || '—'}</td>
                    <td className="text-gray-600 font-medium">{c.issue_count || 0}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="btn-ghost btn-sm btn-icon text-blue-500 hover:bg-blue-50">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm btn-icon text-gray-400">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={`form-input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Pothole" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="form-textarea" placeholder="Brief description…" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select value={form.department_id} onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))} className="form-select">
                  <option value="">No department</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: Number(e.target.value) }))} className="form-select">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline" disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary gap-2" disabled={saving}>
                  <FiCheck className="w-4 h-4" />
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Category"
        message="Issues in this category will become uncategorised. This cannot be undone."
        confirmText="Delete"
        confirmClass="btn-danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}
