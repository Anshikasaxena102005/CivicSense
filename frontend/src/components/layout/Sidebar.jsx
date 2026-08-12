import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiPlusCircle, FiList, FiUsers, FiGrid,
  FiLayers, FiSettings, FiClipboard, FiBarChart2, FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const CITIZEN_NAV = [
  { to: '/citizen',        icon: FiHome,       label: 'Dashboard' },
  { to: '/citizen/report', icon: FiPlusCircle, label: 'Report Issue' },
  { to: '/citizen/issues', icon: FiList,       label: 'My Reports' },
];

const OFFICER_NAV = [
  { to: '/officer',        icon: FiHome,      label: 'Dashboard' },
  { to: '/officer/issues', icon: FiClipboard, label: 'Assigned Issues' },
];

const ADMIN_NAV = [
  { to: '/admin',              icon: FiBarChart2, label: 'Dashboard' },
  { to: '/admin/issues',       icon: FiList,      label: 'All Issues' },
  { to: '/admin/users',        icon: FiUsers,     label: 'Users' },
  { to: '/admin/categories',   icon: FiGrid,      label: 'Categories' },
  { to: '/admin/departments',  icon: FiLayers,    label: 'Departments' },
];

const NAV_MAP = { citizen: CITIZEN_NAV, officer: OFFICER_NAV, admin: ADMIN_NAV };

export const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = NAV_MAP[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    citizen: 'from-blue-600 to-indigo-700',
    officer: 'from-emerald-600 to-teal-700',
    admin:   'from-violet-600 to-purple-700',
  };

  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className={`p-5 bg-gradient-to-r ${roleColors[user?.role] || 'from-gray-700 to-gray-900'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">CivicSense</p>
              <p className="text-white/70 text-xs mt-0.5 capitalize">{user?.role} Portal</p>
            </div>
          </div>
          {/* User info */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/60 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length === 2}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="nav-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
            <FiLogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
