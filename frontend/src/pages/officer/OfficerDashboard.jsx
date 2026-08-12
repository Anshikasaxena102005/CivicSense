import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClipboard, FiCheckCircle, FiRefreshCw, FiClock } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}><Icon className="w-5 h-5" /></div>
    <div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function OfficerDashboard() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([issuesAPI.getOfficerStats(), issuesAPI.getAssigned({ limit: 5 })])
      .then(([s, r]) => { setStats(s.data); setRecent(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner className="mt-20" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="page-title">Officer Dashboard</h1>
            <p className="page-subtitle">Welcome, {user?.name} — manage your assigned issues</p>
          </div>
          <Link to="/officer/issues" className="btn-primary gap-2">
            <FiClipboard className="w-4 h-4" /> View All Issues
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FiClipboard}    label="Total Assigned" value={stats.total}       color="bg-blue-50 text-blue-600" />
            <StatCard icon={FiClock}        label="Assigned"       value={stats.assigned}    color="bg-amber-50 text-amber-600" />
            <StatCard icon={FiRefreshCw}    label="In Progress"    value={stats.in_progress} color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={FiCheckCircle}  label="Resolved"       value={stats.resolved}    color="bg-green-50 text-green-600" />
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Recent Assignments</h2>
            <Link to="/officer/issues" className="btn-ghost btn-sm text-primary-600">View All →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="card-body text-center py-10 text-gray-500">No issues assigned yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((issue) => (
                <Link key={issue.id} to={`/officer/issues/${issue.id}`}
                  className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {issue.citizen_name} · {issue.category_name || 'Uncategorised'} · {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge-${issue.status} shrink-0`}>{issue.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card card-body">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📌 Your Responsibilities</h3>
            <ul className="text-sm text-gray-500 space-y-1.5 list-disc list-inside">
              <li>Update issue status as you work on it</li>
              <li>Add resolution notes when marking resolved</li>
              <li>Upload after-resolution photos as proof</li>
              <li>Respond to reopened issues promptly</li>
            </ul>
          </div>
          <div className="card card-body">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">⚡ Quick Tips</h3>
            <ul className="text-sm text-gray-500 space-y-1.5 list-disc list-inside">
              <li>Mark "In Progress" once you start work</li>
              <li>Document your work with after photos</li>
              <li>Use rejection only if issue is invalid</li>
              <li>Always add a reason when rejecting</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
