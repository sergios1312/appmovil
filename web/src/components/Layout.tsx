import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { IoHome, IoCheckboxOutline, IoCalendar, IoSettings } from 'react-icons/io5';
import type { IconType } from 'react-icons';

interface NavItem {
  path: string;
  label: string;
  Icon: IconType;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', Icon: IoHome },
  { path: '/tasks', label: 'Tareas', Icon: IoCheckboxOutline },
  { path: '/calendar', label: 'Calendario', Icon: IoCalendar },
  { path: '/settings', label: 'Ajustes', Icon: IoSettings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore();
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">
            <IoCheckboxOutline size={22} />
          </div>
          <h1>TaskFlow</h1>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon"><item.Icon size={18} /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {authStore.user && (
          <div className="sidebar-user">
            {authStore.user.avatar_url ? (
              <img src={authStore.user.avatar_url} alt={authStore.user.name} />
            ) : (
              <div className="avatar-placeholder">
                {authStore.user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{authStore.user.name}</div>
              <div className="user-email">{authStore.user.email}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="logo" style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          <IoCheckboxOutline size={18} color="#fff" />
        </div>
        <h1>TaskFlow</h1>
      </div>

      {/* Main Content */}
      <main className="main-content">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon"><item.Icon size={20} /></span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
