import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Pagination } from '../../components/shared/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';

const STATUS_OPTIONS = ['', 'assigned', 'in_progress', 'resolved', 'rejected'];

export default function AssignedIssuesPage() {
  const [issues,     setIssues]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const res = await issuesAPI.getAssigned(params);
      let data = res.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((i) => i.title.toLowerCase().includes(q) || (i.citizen_name || '').toLowerCase().includes(q));
      }
      setIssues(data);
      setPagination(res.pagination);
    } catch {} finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Assigned Issues</h1>
          <p className="page-subtitle">Issues assigned to you for resolution</p>
        </div>

        {/* Filters */}
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9" placeholder="Search by title or citizen name…" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-select pl-9 w-full sm:w-48">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : issues.length === 0 ? (
            <EmptyState title="No issues found" message="No issues match your current filters." />
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Citizen</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="text-gray-400 text-xs">{issue.id}</td>
                      <td>
                        <Link to={`/officer/issues/${issue.id}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                          {issue.title}
                        </Link>
                        {issue.location && <p className="text-xs text-gray-400 mt-0.5 truncate">{issue.location}</p>}
                      </td>
                      <td className="text-gray-600 text-sm">{issue.citizen_name}</td>
                      <td className="text-gray-500">{issue.category_name || '—'}</td>
                      <td><PriorityBadge priority={issue.priority} /></td>
                      <td><StatusBadge status={issue.status} /></td>
                      <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(issue.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
