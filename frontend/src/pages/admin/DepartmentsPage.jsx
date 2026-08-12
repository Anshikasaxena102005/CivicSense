import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUsers } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { adminAPI } from '../../api/adminAPI';

const BLANK = { name: '', description: '', is_active: 1 };

export default function DepartmentsPage() {
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
      const res = await adminAPI.getDepartments();
      setDepts(res.data || []);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setErrors({}); setShowForm(true); };
  const openEdit   = (d) => {
    setForm({ name: d.name, description: d.description || '', is_active: d.is_active });
    setEditId(d.id);
    setErrors({});
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setSaving(true);
    try {
      if (editId) {
        await adminAPI.updateDepartment(editId, form);
        toast.success('Department updated');
      } else {
        await adminAPI.createDepartment(form);
        toast.success('Department created');
      }
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteDepartment(deleteId);
      toast.success('Department deleted');
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
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Manage civic departments</p>
          </div>
          <button onClick={openCreate} className="btn-primary gap-2">
            <FiPlus className="w-4 h-4" /> Add Department
          </button>
        </div>

        {loading ? <LoadingSpinner className="mt-20" /> : depts.length === 0 ? (
          <EmptyState title="No departments" message="Create your first department." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {depts.map((d) => (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{d.name}</h3>
                    {d.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.description}</p>}
                  </div>
                  <span className={`badge shrink-0 ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-3.5 h-3.5" /> {d.officer_count || 0} officers
                  </span>
                  <span>{d.category_count || 0} categories</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(d)} className="btn-outline btn-sm gap-1.5 flex-1">
                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(d.id)} className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editId ? 'Edit Department' : 'New Department'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm btn-icon text-gray-400">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={`form-input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Public Works" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="form-textarea" placeholder="What does this department handle?" />
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
        title="Delete Department"
        message="Officers and categories in this department won't be deleted but will lose their department association."
        confirmText="Delete"
        confirmClass="btn-danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}
