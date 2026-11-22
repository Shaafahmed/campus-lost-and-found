import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6" />
              <line x1="15" y1="15" x2="20" y2="20" />
            </svg>
          </span>
          Campus Lost &amp; Found
        </Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/browse" onClick={close}>Browse Items</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={close}>My Dashboard</NavLink>
              {user.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
              <Link to="/post" className="btn btn-primary btn-sm" onClick={close}>+ Report Item</Link>
              <span className="nav-user" title={user.email}>Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
