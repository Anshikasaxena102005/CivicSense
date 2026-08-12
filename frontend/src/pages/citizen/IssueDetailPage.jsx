import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiClock, FiRefreshCw, FiUser } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { ImageGallery } from '../../components/shared/ImageGallery';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { issuesAPI } from '../../api/issuesAPI';

const timelineIcons = {
  'Issue Created':           '📝',
  'Officer Assigned':        '👮',
  'Status Changed':          '🔄',
  'Issue Resolved':          '✅',
  'Issue Rejected':          '❌',
  'Issue Reopened':          '🔓',
  'Resolution Note Added':   '📋',
  'After-image Uploaded':    '📸',
};

export default function IssueDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [reopening, setReopening] = useState(false);
  const [showReopen, setShowReopen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await issuesAPI.getMyIssue(id);
        setData(res.data);
      } catch { toast.error('Issue not found'); navigate('/citizen/issues'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleReopen = async () => {
    setReopening(true);
    try {
      await issuesAPI.reopenIssue(id, {});
      toast.success('Issue reopened');
      setShowReopen(false);
      const res = await issuesAPI.getMyIssue(id);
      setData(res.data);
    } catch (err) { toast.error(err.message || 'Cannot reopen'); }
    finally { setReopening(false); }
  };

  if (loading) return <DashboardLayout><LoadingSpinner className="mt-20" /></DashboardLayout>;
  if (!data)   return null;

  const { issue, timeline } = data;
  const canReopen = ['resolved', 'rejected'].includes(issue.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link to="/citizen/issues" className="btn-ghost gap-2 text-sm">
            <FiArrowLeft className="w-4 h-4" /> Back to My Reports
          </Link>
          {canReopen && (
            <button onClick={() => setShowReopen(true)} className="btn-outline gap-2 text-sm">
              <FiRefreshCw className="w-4 h-4" /> Reopen Issue
            </button>
          )}
        </div>

        {/* Main card */}
        <div className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{issue.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Reported on {new Date(issue.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={issue.priority} />
              <StatusBadge status={issue.status} />
            </div>
          </div>
          <div className="card-body space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
            </div>

            {/* Meta grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetaItem icon={FiMapPin} label="Category"   value={issue.category_name || '—'} />
              <MetaItem icon={FiMapPin} label="Department" value={issue.department_name || '—'} />
              <MetaItem icon={FiMapPin} label="Location"   value={issue.location || '—'} />
              {issue.officer_name && (
                <MetaItem icon={FiUser} label="Assigned Officer" value={issue.officer_name} />
              )}
              <MetaItem icon={FiClock} label="Last Updated" value={new Date(issue.updated_at).toLocaleString()} />
            </div>

            {/* Before images */}
            {issue.images?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Issue Photos</h3>
                <ImageGallery images={issue.images} />
              </div>
            )}

            {/* Resolution note */}
            {issue.resolution_note && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-1">Resolution Note</h3>
                <p className="text-sm text-green-700">{issue.resolution_note}</p>
              </div>
            )}

            {/* Rejection reason */}
            {issue.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h3>
                <p className="text-sm text-red-700">{issue.rejection_reason}</p>
              </div>
            )}

            {/* After images */}
            {issue.after_images?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">After-Resolution Photos</h3>
                <ImageGallery images={issue.after_images} />
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {timeline?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Issue Timeline</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {timeline.map((entry, i) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                        {timelineIcons[entry.action] || '📌'}
                      </div>
                      {i < timeline.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {entry.user_name ? `by ${entry.user_name}` : 'System'} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showReopen}
        title="Reopen Issue"
        message="This will reopen the issue and remove officer assignment so it gets reassigned."
        confirmText="Reopen"
        confirmClass="btn-primary"
        loading={reopening}
        onConfirm={handleReopen}
        onCancel={() => setShowReopen(false)}
      />
    </DashboardLayout>
  );
}

const MetaItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
);
