import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiPlus, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Pagination } from '../../components/shared/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { adminAPI } from '../../api/adminAPI';

export default function UsersPage() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('');
  const [page,       setPage]       = useState(1);

  // Create officer modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [depts,      setDepts]      = useState([]);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', password: '', department_id: '', phone: '' });
  const [formErrors,  setFormErrors]  = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (role)   params.role   = role;
      if (search) params.search = search;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data || []);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, role, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    adminAPI.getDepartments().then((r) => setDepts(r.data || [])).catch(() => {});
  }, []);

  const handleToggle = async (userId) => {
    try {
      const res = await adminAPI.toggleUser(userId);
      toast.success(res.message);
      fetchUsers();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const validateOfficerForm = () => {
    const e = {};
    if (!officerForm.name.trim())      e.name     = 'Name required';
    if (!officerForm.email.trim())     e.email    = 'Email required';
    if (officerForm.password.length < 8) e.password = 'Min 8 chars';
    else if (!/[A-Z]/.test(officerForm.password)) e.password = 'Need uppercase';
    else if (!/[0-9]/.test(officerForm.password)) e.password = 'Need a number';
    return e;
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    const errs = validateOfficerForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setCreating(true);
    try {
      await adminAPI.createOfficer(officerForm);
      toast.success('Officer account created');
      setShowCreate(false);
      setOfficerForm({ name: '', email: '', password: '', department_id: '', phone: '' });
      fetchUsers();
    } catch (err) { toast.error(err.message || 'Failed to create officer'); }
    finally { setCreating(false); }
  };

  const roleColors = {
    admin:   'bg-violet-100 text-violet-700',
    officer: 'bg-teal-100 text-teal-700',
    citizen: 'bg-blue-100 text-blue-700',
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Manage officers and citizen accounts</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
            <FiPlus className="w-4 h-4" /> Create Officer
          </button>
        </div>

        {/* Filters */}
        <div className="card card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9" placeholder="Search by name or email…" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="form-select w-40">
            <option value="">All roles</option>
            <option value="citizen">Citizen</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="table-container">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" message="Try adjusting your search or filter." />
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="text-gray-400 text-xs">{u.id}</td>
                      <td className="font-medium text-gray-900">{u.name}</td>
                      <td className="text-gray-500 text-sm">{u.email}</td>
                      <td>
                        <span className={`badge ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      </td>
                      <td className="text-gray-500 text-sm">{u.department_name || '—'}</td>
                      <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggle(u.id)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            className={`btn-ghost btn-sm btn-icon ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                            {u.is_active ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Create Officer Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 text-lg mb-5">Create Officer Account</h3>
            <form onSubmit={handleCreateOfficer} className="space-y-4" noValidate>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" value={officerForm.name} onChange={(e) => setOfficerForm((p) => ({ ...p, name: e.target.value }))}
                  className={`form-input ${formErrors.name ? 'border-red-400' : ''}`} placeholder="Officer name" />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" value={officerForm.email} onChange={(e) => setOfficerForm((p) => ({ ...p, email: e.target.value }))}
                  className={`form-input ${formErrors.email ? 'border-red-400' : ''}`} placeholder="officer@civicsense.local" />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" value={officerForm.password} onChange={(e) => setOfficerForm((p) => ({ ...p, password: e.target.value }))}
                  className={`form-input ${formErrors.password ? 'border-red-400' : ''}`} placeholder="Min 8 chars, 1 uppercase, 1 number" />
                {formErrors.password && <span className="form-error">{formErrors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select value={officerForm.department_id} onChange={(e) => setOfficerForm((p) => ({ ...p, department_id: e.target.value }))} className="form-select">
                  <option value="">Select department…</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" value={officerForm.phone} onChange={(e) => setOfficerForm((p) => ({ ...p, phone: e.target.value }))}
                  className="form-input" placeholder="+91 98765 43210" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-outline" disabled={creating}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
