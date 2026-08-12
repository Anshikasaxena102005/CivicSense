import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiSearch, FiFilter, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';
import { adminAPI } from '../../api/adminAPI';

const STATUS_OPTIONS  = ['', 'pending', 'assigned', 'in_progress', 'resolved', 'rejected', 'reopened'];
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical'];

export default function AllIssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues,      setIssues]      = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [status,      setStatus]      = useState(searchParams.get('status') || '');
  const [priority,    setPriority]    = useState('');
  const [page,        setPage]        = useState(1);

  // Assign modal
  const [assignModal, setAssignModal] = useState(null); // issueId
  const [officers,    setOfficers]    = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigning,   setAssigning]   = useState(false);

  // Delete
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status)   params.status   = status;
      if (priority) params.priority = priority;
      if (search)   params.search   = search;
      const res = await issuesAPI.getAll(params);
      setIssues(res.data || []);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  }, [page, status, priority, search]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const openAssign = async (issueId) => {
    setAssignModal(issueId);
    setSelectedOfficer('');
    try {
      const res = await adminAPI.getOfficers();
      setOfficers(res.data || []);
    } catch { toast.error('Failed to load officers'); }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) { toast.error('Select an officer'); return; }
    setAssigning(true);
    try {
      await issuesAPI.assign(assignModal, { officer_id: Number(selectedOfficer) });
      toast.success('Officer assigned!');
      setAssignModal(null);
      fetchIssues();
    } catch (err) { toast.error(err.message || 'Assignment failed'); }
    finally { setAssigning(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await issuesAPI.deleteIssue(deleteId);
      toast.success('Issue deleted');
      setDeleteId(null);
      fetchIssues();
    } catch (err) { toast.error(err.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">All Issues</h1>
          <p className="page-subtitle">Manage all reported civic issues across the platform</p>
        </div>

        {/* Filters */}
        <div className="card card-body flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9" placeholder="Search title or description…" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-select w-44">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="form-select w-36">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All priorities'}</option>)}
          </select>
        </div>

        <div className="table-container">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : issues.length === 0 ? (
            <EmptyState title="No issues found" message="Try adjusting your filters." />
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Citizen</th>
                    <th>Officer</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="text-gray-400 text-xs">{issue.id}</td>
                      <td>
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[180px]">{issue.title}</p>
                        {issue.location && <p className="text-xs text-gray-400 truncate max-w-[180px]">{issue.location}</p>}
                      </td>
                      <td className="text-gray-600 text-sm">{issue.citizen_name}</td>
                      <td className="text-gray-500 text-sm">{issue.officer_name || <span className="text-gray-300">—</span>}</td>
                      <td className="text-gray-500 text-sm">{issue.category_name || '—'}</td>
                      <td><PriorityBadge priority={issue.priority} /></td>
                      <td><StatusBadge status={issue.status} /></td>
                      <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button title="Assign Officer" onClick={() => openAssign(issue.id)}
                            className="btn-ghost btn-sm btn-icon text-blue-500 hover:bg-blue-50">
                            <FiUserCheck className="w-4 h-4" />
                          </button>
                          <button title="Delete Issue" onClick={() => setDeleteId(issue.id)}
                            className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Assign Officer Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Assign Officer</h3>
            <div className="form-group mb-4">
              <label className="form-label">Select Officer</label>
              <select value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)} className="form-select">
                <option value="">Choose an officer…</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.department_name || 'No dept'} ({o.active_issues} active)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAssignModal(null)} className="btn-outline" disabled={assigning}>Cancel</button>
              <button onClick={handleAssign} className="btn-primary" disabled={assigning}>
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Issue"
        message="Permanently delete this issue and all its timeline entries?"
        confirmText="Delete"
        confirmClass="btn-danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}
