import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiBell, FiCheck, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Pagination } from '../components/shared/Pagination';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { notificationsAPI } from '../api/notificationsAPI';
import { useAuth } from '../context/AuthContext';

const typeColors = {
  info:    'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  error:   'bg-red-50 border-red-200 text-red-700',
};

const typeIcons = { info: '💬', success: '✅', warning: '⚠️', error: '❌' };

export default function NotificationsPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination,    setPagination]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [markingAll,    setMarkingAll]    = useState(false);
  const [page,          setPage]          = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ page, limit: 15 });
      setNotifications(res.data || []);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
    finally { setMarkingAll(false); }
  };

  const handleClick = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    if (notif.related_issue_id) {
      const dashMap = { citizen: '/citizen', officer: '/officer', admin: '/admin' };
      const base = dashMap[user?.role];
      if (base === '/citizen') navigate(`/citizen/issues/${notif.related_issue_id}`);
      else if (base === '/officer') navigate(`/officer/issues/${notif.related_issue_id}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FiBell className="w-6 h-6" /> Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-normal bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="page-subtitle">Stay up to date with your issue updates</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingAll} className="btn-outline btn-sm gap-2">
              <FiCheckSquare className="w-4 h-4" />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner className="mt-20" />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            message="You'll receive notifications when your issues are updated."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`
                  relative rounded-xl border p-4 transition-all cursor-pointer
                  ${!n.is_read ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{typeIcons[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    {n.issue_title && (
                      <p className="text-xs text-gray-400 mt-1">Issue: {n.issue_title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 mt-3 justify-end" onClick={(e) => e.stopPropagation()}>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="btn-ghost btn-sm gap-1 text-xs text-primary-600">
                      <FiCheck className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="btn-ghost btn-sm gap-1 text-xs text-red-500 hover:bg-red-50">
                    <FiTrash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}

            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
