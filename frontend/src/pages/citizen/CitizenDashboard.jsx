import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiList, FiCheckCircle, FiClock, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, r] = await Promise.all([
          issuesAPI.getMyStats(),
          issuesAPI.getMyIssues({ limit: 5 }),
        ]);
        setStats(s.data);
        setRecent(r.data || []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner className="mt-20" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="page-subtitle">Track and manage your civic issue reports</p>
          </div>
          <Link to="/citizen/report" className="btn-primary gap-2">
            <FiPlusCircle className="w-4 h-4" />
            Report New Issue
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FiList}        label="Total Reports"  value={stats.total}       color="bg-blue-50 text-blue-600" />
            <StatCard icon={FiClock}       label="Pending"        value={stats.pending + (stats.reopened || 0)} color="bg-amber-50 text-amber-600" />
            <StatCard icon={FiAlertCircle} label="In Progress"    value={(stats.assigned || 0) + (stats.in_progress || 0)} color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={FiCheckCircle} label="Resolved"       value={stats.resolved}    color="bg-green-50 text-green-600" />
          </div>
        )}

        {/* Recent Issues */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Recent Reports</h2>
            <Link to="/citizen/issues" className="btn-ghost btn-sm text-primary-600">View All →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="card-body text-center py-10">
              <p className="text-gray-500 mb-3">No issues reported yet.</p>
              <Link to="/citizen/report" className="btn-primary btn-sm">Report your first issue</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((issue) => (
                <Link key={issue.id} to={`/citizen/issues/${issue.id}`} className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{issue.category_name || 'Uncategorised'} · {new Date(issue.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge-${issue.status} shrink-0`}>{issue.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick tips */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: '📸', title: 'Add Photos', desc: 'Photos help officers resolve issues faster' },
            { icon: '📍', title: 'Add Location', desc: 'Precise location speeds up assignment' },
            { icon: '🔔', title: 'Track Progress', desc: 'Get notified when your issue status changes' },
          ].map((tip) => (
            <div key={tip.title} className="card card-body flex items-start gap-3">
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
