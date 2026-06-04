import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';

/* ── SVG ICONS ─────────────────────────────────── */
const I = {
  Dashboard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Inbox:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 9 12 15 21 9"/><path d="M21 9V19a2 2 0 01-2 2H5a2 2 0 01-2-2V9"/></svg>,
  Lesson:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>,
  Task:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  Group:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Settings:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  Logout:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Mail:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Bell:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Search:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Courses:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#a29bfe,#6c5ce7)',
  'linear-gradient(135deg,#fdcb6e,#e17055)',
  'linear-gradient(135deg,#55efc4,#00b894)',
  'linear-gradient(135deg,#74b9ff,#0984e3)',
  'linear-gradient(135deg,#fd79a8,#e84393)',
];

export const ColorAvatar: React.FC<{ name: string; url?: string; size?: number; idx?: number; style?: React.CSSProperties }> = ({
  name, url, size = 36, idx = 0, style,
}) => {
  if (url) {
    return (
      <img src={url} alt={name} style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style
      }} />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
      ...style,
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
};

/* ── NOTIFICATION DROPDOWN ─────────────────────── */
const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const { setUnreadCount } = useApp();

  useEffect(() => {
    api.get('/users/notifications').then(r => {
      setNotes(r.data);
      setUnreadCount(r.data.filter((n: any) => !n.read).length);
    }).catch(() => {});
  }, []);

  const markAll = async () => {
    await api.put('/users/notifications/read-all');
    setNotes(prev => prev.map(n => ({ ...n, read: 1 })));
    setUnreadCount(0);
  };

  const typeIcon: Record<string, string> = {
    enroll: '📚', certificate: '🎓', follow: '👤', info: 'ℹ',
  };

  return (
    <div style={{
      position: 'absolute', top: '110%', right: 0,
      width: '320px', background: 'white',
      border: '1px solid var(--border)', borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 200, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.125rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Notifications</span>
        <button onClick={markAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>Mark all read</button>
      </div>
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {notes.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No notifications yet
          </div>
        )}
        {notes.map(n => (
          <div key={n.id} onClick={async () => { await api.put(`/users/notifications/${n.id}/read`); setNotes(prevNotes => prevNotes.map(x => x.id === n.id ? { ...x, read: 1 } : x)); setUnreadCount((prev: number) => Math.max(0, prev - (n.read ? 0 : 1))); onClose(); }} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(108,92,231,0.04)', transition: 'background 0.2s' }}>
            <span style={{ fontSize: '1.25rem' }}>{typeIcon[n.type] || 'ℹ'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.8125rem', marginBottom: '0.125rem' }}>{n.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── SEARCH DROPDOWN ────────────────────────────── */
const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/courses/search?q=${encodeURIComponent(query)}`);
        setResults(r.data);
        setOpen(true);
      } catch (_) {}
    }, 300);
  }, [query]);

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
      <div className="search-bar">
        <I.Search />
        <input
          placeholder="Search your course...."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {open && results && (
        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden' }}>
          {results.courses?.length === 0 && results.lessons?.length === 0 && (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No results found</div>
          )}
          {results.courses?.map((c: any) => (
            <Link key={`c-${c.id}`} to={`/courses`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }} onClick={() => setOpen(false)}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '0.15rem 0.5rem', borderRadius: 4 }}>COURSE</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.title}</span>
            </Link>
          ))}
          {results.lessons?.map((l: any) => (
            <Link key={`l-${l.id}`} to={`/course/${l.course_id || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }} onClick={() => setOpen(false)}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.5rem', borderRadius: 4 }}>LESSON</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{l.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.course_title}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── SIDEBAR ────────────────────────────────────── */
export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const mainNav = [
    { label: 'Dashboard', path: '/dashboard', icon: <I.Dashboard /> },
    { label: 'Courses',   path: '/courses',   icon: <I.Courses /> },
    { label: 'Paths',     path: '/paths',     icon: <I.Courses /> },
    { label: 'Inbox',     path: '/inbox',     icon: <I.Inbox /> },
    { label: 'Lesson',    path: '/lesson',    icon: <I.Lesson /> },
    { label: 'Task',      path: '/task',      icon: <I.Task /> },
    { label: 'Mentors',   path: '/mentors',   icon: <I.Group /> },
  ];



  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <h2>Coursue</h2>
      </div>

      <nav>
        <p className="sidebar-section-label" style={{ marginTop: 0 }}>Overview</p>
        {mainNav.map(item => (
          <Link key={item.label} to={item.path} className={`nav-link${location.pathname.startsWith(item.path) ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {user?.role === 'admin' && (
        <nav style={{ marginTop: '1.5rem' }}>
          <p className="sidebar-section-label" style={{ marginTop: 0 }}>Admin Panel</p>
          <Link to="/admin/dashboard" className={`nav-link${location.pathname === '/admin/dashboard' ? ' active' : ''}`}>
            <span className="nav-icon"><I.Dashboard /></span>
            <span>Stats</span>
          </Link>
          <Link to="/admin/users" className={`nav-link${location.pathname === '/admin/users' ? ' active' : ''}`}>
            <span className="nav-icon"><I.Group /></span>
            <span>Users</span>
          </Link>
          <Link to="/admin/courses" className={`nav-link${location.pathname === '/admin/courses' ? ' active' : ''}`}>
            <span className="nav-icon"><I.Courses /></span>
            <span>Manage Courses</span>
          </Link>
          <Link to="/admin/paths" className={`nav-link${location.pathname === '/admin/paths' ? ' active' : ''}`}>
            <span className="nav-icon"><I.Courses /></span>
            <span>Manage Paths</span>
          </Link>
        </nav>
      )}

      {user?.role === 'mentor' && (
        <nav style={{ marginTop: '1.5rem' }}>
          <p className="sidebar-section-label" style={{ marginTop: 0 }}>Mentor Panel</p>
          <Link to="/mentor/dashboard" className={`nav-link${location.pathname === '/mentor/dashboard' ? ' active' : ''}`}>
            <span className="nav-icon"><I.Dashboard /></span>
            <span>Mentor Dashboard</span>
          </Link>
        </nav>
      )}



      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <p className="sidebar-section-label" style={{ marginTop: 0 }}>Settings</p>
        <Link to="/settings" className={`nav-link${location.pathname === '/settings' ? ' active' : ''}`}>
          <span className="nav-icon"><I.Settings /></span>
          <span>Setting</span>
        </Link>
        <button onClick={logout} className="nav-link" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#e17055' }}>
          <span className="nav-icon"><I.Logout /></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

/* ── TOP HEADER ─────────────────────────────────── */
export const TopHeader: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="top-header">
      <SearchBar />
      <div className="header-actions">
        <Link to="/inbox" className="icon-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
          <I.Mail />
        </Link>
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowNotifs(p => !p)} style={{ position: 'relative' }}>
            <I.Bell />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#e17055', border: '2px solid white' }} />
            )}
          </button>
          {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
        </div>
        <Link to="/profile" className="user-profile" style={{ textDecoration: 'none' }}>
          <ColorAvatar name={user?.username || 'U'} url={user?.avatarUrl} size={36} idx={0} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
            {user?.username}
          </span>
        </Link>
      </div>
    </header>
  );
};

/* ── LAYOUT WRAPPER ─────────────────────────────── */
const Layout: React.FC<{ children: React.ReactNode; rightPanel?: React.ReactNode }> = ({ children, rightPanel }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">
      <TopHeader />
      <div className="main-body">
        <div className="main-center animate-up">{children}</div>
        {rightPanel && <aside className="right-panel">{rightPanel}</aside>}
      </div>
    </div>
  </div>
);

export default Layout;
