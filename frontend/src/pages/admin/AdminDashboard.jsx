import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiList, FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { adminAPI } from '../../api/adminAPI';

const COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#22c55e', '#ef4444', '#f97316'];

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const el = (
    <div className={`stat-card hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`stat-icon ${color}`}><Icon className="w-5 h-5" /></div>
      <div><div className="stat-value">{value ?? 0}</div><div className="stat-label">{label}</div></div>
    </div>
  );
  return to ? <Link to={to}>{el}</Link> : el;
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner className="mt-20" /></DashboardLayout>;
  if (!stats)  return <DashboardLayout><p className="text-red-500">Failed to load stats</p></DashboardLayout>;

  const issueStatusData = [
    { name: 'Pending',     value: Number(stats.issues.pending)     || 0 },
    { name: 'Assigned',    value: Number(stats.issues.assigned)    || 0 },
    { name: 'In Progress', value: Number(stats.issues.in_progress) || 0 },
    { name: 'Resolved',    value: Number(stats.issues.resolved)    || 0 },
    { name: 'Rejected',    value: Number(stats.issues.rejected)    || 0 },
    { name: 'Reopened',    value: Number(stats.issues.reopened)    || 0 },
  ].filter((d) => d.value > 0);

  const topCatData = (stats.topCategories || []).map((c) => ({ name: c.name, count: Number(c.count) }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide overview and management</p>
        </div>

        {/* Issue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={FiList}        label="Total Issues"  value={stats.issues.total}       color="bg-gray-100 text-gray-600"    to="/admin/issues" />
          <StatCard icon={FiClock}       label="Pending"       value={stats.issues.pending}      color="bg-amber-50 text-amber-600"  to="/admin/issues?status=pending" />
          <StatCard icon={FiAlertCircle} label="Assigned"      value={stats.issues.assigned}     color="bg-blue-50 text-blue-600"    to="/admin/issues?status=assigned" />
          <StatCard icon={FiBarChart2}   label="In Progress"   value={stats.issues.in_progress}  color="bg-indigo-50 text-indigo-600" to="/admin/issues?status=in_progress" />
          <StatCard icon={FiCheckCircle} label="Resolved"      value={stats.issues.resolved}     color="bg-green-50 text-green-600"  to="/admin/issues?status=resolved" />
          <StatCard icon={FiXCircle}     label="Rejected"      value={stats.issues.rejected}     color="bg-red-50 text-red-600"      to="/admin/issues?status=rejected" />
        </div>

        {/* User Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={FiUsers} label="Total Users"   value={stats.users.total}    color="bg-violet-50 text-violet-600" to="/admin/users" />
          <StatCard icon={FiUsers} label="Citizens"      value={stats.users.citizens} color="bg-cyan-50 text-cyan-600"     to="/admin/users?role=citizen" />
          <StatCard icon={FiUsers} label="Officers"      value={stats.users.officers} color="bg-teal-50 text-teal-600"     to="/admin/users?role=officer" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie: issue distribution */}
          {issueStatusData.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="section-title">Issue Status Distribution</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={issueStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {issueStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bar: top categories */}
          {topCatData.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="section-title">Top Issue Categories</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topCatData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent Issues */}
        {stats.recentIssues?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Recent Issues</h2>
              <Link to="/admin/issues" className="btn-ghost btn-sm text-primary-600">View All →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.recentIssues.map((issue) => (
                <Link key={issue.id} to={`/admin/issues`}
                  className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {issue.citizen_name} · {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
