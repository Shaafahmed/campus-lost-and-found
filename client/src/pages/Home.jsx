import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ItemCard from '../components/ItemCard.jsx';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/items/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/items', { params: { limit: 8 } }).then((r) => setRecent(r.data.items)).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow">For students, by students</span>
            <h1>
              Lost something on campus?
              <br />
              <span className="accent">Let's find it together.</span>
            </h1>
            <p>
              Report lost or found items in seconds, search everything posted across campus, and get matched with the
              right owner, all in one place.
            </p>
            <form className="hero-search" onSubmit={search}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search e.g. wallet, earbuds, ID card…"
              />
              <button className="btn btn-primary">Search</button>
            </form>
            <div className="hero-actions">
              <Link to="/post?type=lost" className="btn btn-lost">I lost something</Link>
              <Link to="/post?type=found" className="btn btn-found">I found something</Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-num">{stats?.total ?? '–'}</div>
              <div className="stat-label">Items reported</div>
            </div>
            <div className="stat-card lost">
              <div className="stat-num">{stats?.lost ?? '–'}</div>
              <div className="stat-label">Lost reports</div>
            </div>
            <div className="stat-card found">
              <div className="stat-num">{stats?.found ?? '–'}</div>
              <div className="stat-label">Found reports</div>
            </div>
            <div className="stat-card done">
              <div className="stat-num">{stats?.resolved ?? '–'}</div>
              <div className="stat-label">Returned to owners</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Report</h3>
            <p>Post a lost or found item with a photo, location and date.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Match</h3>
            <p>The portal suggests possible matches from the opposite list automatically.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Claim</h3>
            <p>Send a request with proof. The poster approves it and contact details are shared.</p>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <h3>Return</h3>
            <p>Meet up on campus, hand over the item and mark it as resolved.</p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">Recently reported</h2>
          <Link to="/browse" className="link">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted">No items yet. Be the first to report one!</p>
        ) : (
          <div className="grid">
            {recent.map((it) => (
              <ItemCard key={it._id} item={it} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
