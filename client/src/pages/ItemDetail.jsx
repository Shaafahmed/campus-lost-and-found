import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import ItemCard, { ItemImage, StatusBadge, TypeBadge } from '../components/ItemCard.jsx';
import { formatDate, timeAgo } from '../utils.js';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [myClaim, setMyClaim] = useState(null);

  useEffect(() => {
    setItem(null);
    setError('');
    setNotice(null);
    setMyClaim(null);
    api
      .get(`/items/${id}`)
      .then((r) => setItem(r.data))
      .catch((e) => setError(errorMessage(e)));
    api.get(`/items/${id}/matches`).then((r) => setMatches(r.data)).catch(() => setMatches([]));
  }, [id]);

  // Has the logged-in user already sent a request on this item?
  useEffect(() => {
    if (!user) return;
    api
      .get('/claims/sent')
      .then((r) => setMyClaim(r.data.find((c) => c.item?._id === id) || null))
      .catch(() => {});
  }, [id, user]);

  if (error) return <div className="container section"><div className="alert alert-error">{error}</div></div>;
  if (!item) return <div className="container section"><p className="muted">Loading…</p></div>;

  const isOwner = user && item.postedBy && user._id === item.postedBy._id;
  const isAdmin = user?.role === 'admin';

  const sendClaim = async (e) => {
    e.preventDefault();
    setSending(true);
    setNotice(null);
    try {
      const res = await api.post('/claims', { itemId: item._id, message });
      setMessage('');
      setMyClaim(res.data);
      setNotice({ type: 'success', text: 'Request sent! You can track it in your dashboard.' });
    } catch (err) {
      setNotice({ type: 'error', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    try {
      await api.put(`/items/${item._id}`, { status: 'resolved' });
      setItem({ ...item, status: 'resolved' });
      setNotice({ type: 'success', text: 'Marked as resolved. Any pending requests were closed.' });
    } catch (err) {
      setNotice({ type: 'error', text: errorMessage(err) });
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/items/${item._id}`);
      navigate(isAdmin && !isOwner ? '/admin' : '/dashboard');
    } catch (err) {
      setNotice({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <div className="container section">
      <Link to="/browse" className="link small">← Back to browse</Link>
      <div className="detail">
        <div className="detail-img card">
          <ItemImage src={item.image} alt={item.title} />
        </div>
        <div className="detail-info">
          <div className="detail-badges">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            <span className="badge badge-cat">{item.category}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="detail-desc">{item.description}</p>

          <div className="detail-facts card">
            <div><span>Location</span><strong>{item.location}</strong></div>
            <div><span>{item.type === 'lost' ? 'Lost on' : 'Found on'}</span><strong>{formatDate(item.date)}</strong></div>
            <div><span>Posted by</span><strong>{item.postedBy?.name || 'Unknown'}</strong></div>
            <div><span>Posted</span><strong>{timeAgo(item.createdAt)}</strong></div>
          </div>

          {(isOwner || isAdmin) && (
            <div className="owner-actions">
              {isOwner && <Link to={`/items/${item._id}/edit`} className="btn btn-ghost">Edit</Link>}
              {item.status !== 'resolved' && (
                <button className="btn btn-found" onClick={markResolved}>Mark as resolved</button>
              )}
              <button className="btn btn-danger" onClick={remove}>Delete</button>
            </div>
          )}
          {(isOwner || isAdmin) && notice && <div className={`alert alert-${notice.type}`}>{notice.text}</div>}

          {!isOwner && myClaim && (
            <div className="alert alert-info">
              You sent a request on this item. Status: <strong>{myClaim.status}</strong>.{' '}
              <Link to="/dashboard" className="link">View in dashboard</Link>
            </div>
          )}

          {!isOwner && !isAdmin && !myClaim && item.status === 'open' && (
            <div className="claim-box card">
              <h3>{item.type === 'found' ? 'Is this yours?' : 'Have you found this?'}</h3>
              {user ? (
                <form onSubmit={sendClaim}>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      item.type === 'found'
                        ? 'Describe something only the owner would know (marks, contents, serial number)…'
                        : 'Tell the owner where and when you found it…'
                    }
                  />
                  <button className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending…' : item.type === 'found' ? 'Claim this item' : 'I found this'}
                  </button>
                </form>
              ) : (
                <p>
                  <Link to="/login" state={{ from: `/items/${item._id}` }} className="link">Log in</Link> to send a
                  request to the person who posted this.
                </p>
              )}
              {notice && <div className={`alert alert-${notice.type}`}>{notice.text}</div>}
              <p className="muted small">Contact details are shared only after the poster approves your request.</p>
            </div>
          )}
          {item.status !== 'open' && !isOwner && (
            <div className="alert alert-info">This item has already been {item.status}.</div>
          )}
        </div>
      </div>

      {matches.length > 0 && (
        <section className="section">
          <h2 className="section-title">Possible matches</h2>
          <p className="muted">
            {item.type === 'lost' ? 'Found' : 'Lost'} reports in the same category with similar details.
          </p>
          <div className="grid">
            {matches.map((m) => (
              <ItemCard key={m._id} item={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
