import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browse Cars' },
  { to: '/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const { user, loading, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="logo">🏎️</span>
          <span>Auto<em>Vault</em></span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}

          {loading ? null : user ? (
            <div className="user-menu" onClick={() => setMenu(!menu)}>
              <button className="user-chip" aria-label="Account menu">
                {user.picture ? (
                  <img src={user.picture} alt="" className="user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="user-avatar placeholder">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                )}
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <span className="caret">▾</span>
              </button>
              {menu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/publish" onClick={() => { setMenu(false); setOpen(false); }}>➕ Publish a car</Link>
                  <button
                    onClick={async () => { setMenu(false); setOpen(false); await logout(); }}
                  >
                    ⎋ Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/api/auth/google" className="btn btn-google btn-sm nav-cta" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
              </svg>
              Sign in with Google
            </a>
          )}

          <Link to="/publish" className="btn btn-primary btn-sm nav-cta" onClick={() => setOpen(false)}>
            + Publish a Car
          </Link>
        </nav>

        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
