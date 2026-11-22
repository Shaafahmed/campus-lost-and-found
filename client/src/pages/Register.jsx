import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/client';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', usn: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { confirm, ...data } = form; // eslint-disable-line no-unused-vars
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">Join the campus Lost &amp; Found community.</p>
        <label>
          Full name *
          <input required value={form.name} onChange={set('name')} />
        </label>
        <label>
          College email *
          <input type="email" required value={form.email} onChange={set('email')} />
        </label>
        <div className="row">
          <label>
            USN
            <input value={form.usn} onChange={set('usn')} placeholder="1MS23CS001" />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={set('phone')} pattern="[0-9]{10}" title="10 digit number" />
          </label>
        </div>
        <div className="row">
          <label>
            Password *
            <input type="password" required minLength={6} value={form.password} onChange={set('password')} />
          </label>
          <label>
            Confirm password *
            <input type="password" required value={form.confirm} onChange={set('confirm')} />
          </label>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
        <p className="muted small center">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}
