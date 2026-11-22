import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { ItemImage, StatusBadge, TypeBadge } from '../components/ItemCard.jsx';
import { formatDate, timeAgo } from '../utils.js';

function ClaimStatus({ status }) {
  return <span className={`badge claim-${status}`}>{status[0].toUpperCase() + status.slice(1)}</span>;
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('posts');
  const [mine, setMine] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [profile, setProfile] = useState({ name: user.name, usn: user.usn || '', phone: user.phone || '' });
  const [msg, setMsg] = useState(null);

  const load = () => {
    api.get('/items/mine').then((r) => setMine(r.data));
    api.get('/claims/received').then((r) => setReceived(r.data));
    api.get('/claims/sent').then((r) => setSent(r.data));
  };
  useEffect(load, []);

  const respond = async (claimId, status) => {
    try {
      await api.patch(`/claims/${claimId}`, { status });
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const r = await api.put('/auth/me', profile);
      setUser(r.data.user);
      setMsg({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) });
    }
  };

  const pending = received.filter((c) => c.status === 'pending').length;

  return (
    <div className="container section">
      <div className="dash-head">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="muted">Manage your reports and the requests on them.</p>
        </div>
        <Link to="/post" className="btn btn-primary">+ Report Item</Link>
      </div>

      <div className="mini-stats">
        <div className="card"><strong>{mine.length}</strong><span>My reports</span></div>
        <div className="card"><strong>{pending}</strong><span>Requests to review</span></div>
        <div className="card"><strong>{sent.length}</strong><span>Requests I sent</span></div>
        <div className="card"><strong>{mine.filter((i) => i.status !== 'open').length}</strong><span>Closed reports</span></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>My Reports</button>
        <button className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          Requests Received {pending > 0 && <span className="count">{pending}</span>}
        </button>
        <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>Requests Sent</button>
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
      </div>

      {tab === 'posts' && (
        <div className="list">
          {mine.length === 0 && <div className="empty card"><p className="muted">You haven't reported any items yet.</p></div>}
          {mine.map((it) => (
            <div key={it._id} className="list-row card">
              <div className="thumb"><ItemImage src={it.image} alt={it.title} /></div>
              <div className="list-main">
                <div className="list-badges"><TypeBadge type={it.type} /><StatusBadge status={it.status} /></div>
                <Link to={`/items/${it._id}`} className="list-title">{it.title}</Link>
                <div className="muted small">📍 {it.location} · {formatDate(it.date)}</div>
              </div>
              <div className="list-side">
                {it.pendingClaims > 0 && <span className="badge claim-pending">{it.pendingClaims} pending</span>}
                <Link to={`/items/${it._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'received' && (
        <div className="list">
          {received.length === 0 && <div className="empty card"><p className="muted">No one has responded to your reports yet.</p></div>}
          {received.map((c) => (
            <div key={c._id} className="claim-row card">
              <div className="claim-top">
                <div>
                  <strong>{c.claimant?.name}</strong> {c.item.type === 'found' ? 'says this is theirs:' : 'says they found:'}{' '}
                  <Link to={`/items/${c.item._id}`} className="link">{c.item.title}</Link>
                </div>
                <ClaimStatus status={c.status} />
              </div>
              <p className="claim-msg">“{c.message}”</p>
              <div className="claim-bottom">
                <span className="muted small">
                  {c.claimant?.usn && `${c.claimant.usn} · `}
                  {timeAgo(c.createdAt)}
                </span>
                {c.status === 'pending' && (
                  <div className="btn-group">
                    <button className="btn btn-found btn-sm" onClick={() => respond(c._id, 'approved')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => respond(c._id, 'rejected')}>Reject</button>
                  </div>
                )}
                {c.status === 'approved' && (
                  <span className="contact">Contact: {c.claimant.email}{c.claimant.phone && ` · ${c.claimant.phone}`}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sent' && (
        <div className="list">
          {sent.length === 0 && <div className="empty card"><p className="muted">You haven't sent any requests yet.</p></div>}
          {sent.map((c) => (
            <div key={c._id} className="claim-row card">
              <div className="claim-top">
                <div>
                  Request on <Link to={`/items/${c.item._id}`} className="link">{c.item.title}</Link>{' '}
                  <span className="muted">posted by {c.item.postedBy?.name}</span>
                </div>
                <ClaimStatus status={c.status} />
              </div>
              <p className="claim-msg">“{c.message}”</p>
              <div className="claim-bottom">
                <span className="muted small">{timeAgo(c.createdAt)}</span>
                {c.status === 'approved' && (
                  <span className="contact">
                    Contact: {c.item.postedBy?.email}
                    {c.item.postedBy?.phone && ` · ${c.item.postedBy.phone}`}
                    {c.item.contactInfo && ` · ${c.item.contactInfo}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'profile' && (
        <form className="card form narrow-form" onSubmit={saveProfile}>
          <label>
            Email
            <input value={user.email} disabled />
          </label>
          <label>
            Full name
            <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <div className="row">
            <label>
              USN
              <input value={profile.usn} onChange={(e) => setProfile({ ...profile, usn: e.target.value })} />
            </label>
            <label>
              Phone
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </label>
          </div>
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <button className="btn btn-primary">Save profile</button>
        </form>
      )}
    </div>
  );
}
