import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const DashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const AUTHOR_LINKS = [
  { path: '/author/books', label: 'My Books', icon: BookIcon },
  { path: '/author/tickets', label: 'My Tickets', icon: TicketIcon },
  { path: '/author/submit', label: 'Submit Query', icon: PlusIcon },
];

const ADMIN_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: DashIcon },
  { path: '/admin/tickets', label: 'Ticket Queue', icon: TicketIcon },
  { path: '/admin/books', label: 'All Books', icon: BookIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === 'admin' ? ADMIN_LINKS : AUTHOR_LINKS;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🍃 BookLeaf</h2>
        <p>{user?.role === 'admin' ? 'Admin Console' : 'Author Portal'}</p>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ path, label, icon: Icon }) => (
          <div
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon />
            {label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user?.name}</p>
            <p>{user?.email}</p>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}
