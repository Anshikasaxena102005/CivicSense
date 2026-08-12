import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiSearch, FiFilter, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'in_progress', 'resolved', 'rejected', 'reopened'];

export default function MyReportsPage() {
  const [issues,  setIssues]  = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const res = await issuesAPI.getMyIssues(params);
      let data = res.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((i) =>
          i.title.toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q)
        );
      }
      setIssues(data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await issuesAPI.deleteMyIssue(confirmId);
      toast.success('Issue deleted');
      setConfirmId(null);
      fetchIssues();
    } catch (err) { toast.error(err.message || 'Cannot delete this issue'); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="page-title">My Reports</h1>
            <p className="page-subtitle">All issues you have reported</p>
          </div>
          <Link to="/citizen/report" className="btn-primary gap-2">
            <FiPlusCircle className="w-4 h-4" /> New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9" placeholder="Search by title or location…" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-select pl-9 w-full sm:w-44">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : issues.length === 0 ? (
            <EmptyState
              title="No issues found"
              message="Try changing the filter or report a new issue."
              action={<Link to="/citizen/report" className="btn-primary btn-sm">Report Issue</Link>}
            />
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="text-gray-400 text-xs">{issue.id}</td>
                      <td>
                        <Link to={`/citizen/issues/${issue.id}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                          {issue.title}
                        </Link>
                        {issue.location && <p className="text-xs text-gray-400 mt-0.5 truncate">{issue.location}</p>}
                      </td>
                      <td className="text-gray-500">{issue.category_name || '—'}</td>
                      <td><StatusBadge status={issue.status} /></td>
                      <td><PriorityBadge priority={issue.priority} /></td>
                      <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td>
                        {issue.status === 'pending' && (
                          <button onClick={() => setConfirmId(issue.id)} className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50">
                            <FiTrash2 className="w-4 h-4" />
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

      <ConfirmModal
        isOpen={!!confirmId}
        title="Delete Issue"
        message="Are you sure? This cannot be undone. Only pending issues can be deleted."
        confirmText="Delete"
        confirmClass="btn-danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </DashboardLayout>
  );
}
