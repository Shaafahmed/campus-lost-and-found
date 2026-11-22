import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import ItemCard from '../components/ItemCard.jsx';

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState(params.get('q') || '');

  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    api.get('/items/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/items', { params: { type, category, status, sort, page, q: params.get('q') || '', limit: 12 } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update('q', q.trim());
  };

  const clearAll = () => {
    setQ('');
    setParams({});
  };

  return (
    <div className="container section">
      <h1 className="page-title">Browse Items</h1>
      <p className="muted">Search through everything reported on campus. Resolved items are hidden unless you filter for them.</p>

      <div className="tabs">
        {[
          ['', 'All'],
          ['lost', 'Lost'],
          ['found', 'Found'],
        ].map(([val, label]) => (
          <button key={label} className={`tab ${type === val ? 'active' : ''}`} onClick={() => update('type', val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="filters card">
        <form onSubmit={submitSearch} className="filter-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by keyword or location…" />
          <button className="btn btn-primary">Search</button>
        </form>
        <select value={category} onChange={(e) => update('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => update('status', e.target.value)}>
          <option value="">Open &amp; claimed</option>
          <option value="open">Open only</option>
          <option value="claimed">Claimed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <p className="muted small">{loading ? 'Loading…' : `${data.total} item${data.total === 1 ? '' : 's'} found`}</p>

      {!loading && data.items.length === 0 ? (
        <div className="empty card">
          <h3>No items match your search</h3>
          <p className="muted">Try different keywords or clear the filters.</p>
        </div>
      ) : (
        <div className="grid">
          {data.items.map((it) => (
            <ItemCard key={it._id} item={it} />
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => update('page', String(page - 1))}>
            ← Prev
          </button>
          <span>Page {data.page} of {data.pages}</span>
          <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => update('page', String(page + 1))}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
