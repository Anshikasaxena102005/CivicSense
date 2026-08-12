import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell } from 'react-icons/fi';
import { notificationsAPI } from '../../api/notificationsAPI';

export const Topbar = ({ onMenuClick }) => {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationsAPI.getUnreadCount();
        setUnread(res.data?.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden btn-ghost btn-icon"
        aria-label="Open menu"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/notifications')}
          className="btn-ghost btn-icon relative"
          aria-label="Notifications"
        >
          <FiBell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
