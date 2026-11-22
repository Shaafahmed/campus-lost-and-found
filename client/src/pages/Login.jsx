import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/client';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in -> no need to show the login form
  if (user && !loading) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to report items and manage your requests.</p>
        <label>
          Email
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        <p className="muted small center">
          New here? <Link to="/register" className="link">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
