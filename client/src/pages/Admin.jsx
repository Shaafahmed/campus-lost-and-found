import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { StatusBadge, TypeBadge } from '../components/ItemCard.jsx';
import { formatDate } from '../utils.js';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('items');
  const [filter, setFilter] = useState('');

  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/items').then((r) => setItems(r.data));
    api.get('/admin/users').then((r) => setUsers(r.data));
  };
  useEffect(load, []);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/items/${id}`, { status });
    } catch (err) {
      alert(errorMessage(err));
    }
    load();
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this item and all its requests?')) return;
    try {
      await api.delete(`/items/${id}`);
    } catch (err) {
      alert(errorMessage(err));
    }
    load();
  };

  const toggleBlock = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/block`, { isBlocked: !u.isBlocked });
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const max = stats ? Math.max(1, ...stats.byCategory.map((c) => c.count)) : 1;
  const shown = items.filter((i) =>
    `${i.title} ${i.category} ${i.location} ${i.postedBy?.name}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container section">
      <h1 className="page-title">Admin Panel</h1>
      <p className="muted">Monitor activity and moderate posts across the portal.</p>

      {stats && (
        <>
          <div className="mini-stats six">
            <div className="card"><strong>{stats.users}</strong><span>Students</span></div>
            <div className="card lost"><strong>{stats.lost}</strong><span>Lost reports</span></div>
            <div className="card found"><strong>{stats.found}</strong><span>Found reports</span></div>
            <div className="card"><strong>{stats.open}</strong><span>Open</span></div>
            <div className="card"><strong>{stats.claimed + stats.resolved}</strong><span>Claimed / resolved</span></div>
            <div className="card"><strong>{stats.pendingClaims}</strong><span>Pending requests</span></div>
          </div>

          <div className="card chart">
            <h3>Reports by category</h3>
            {stats.byCategory.map((c) => (
              <div key={c._id} className="bar-row">
                <span className="bar-label">{c._id}</span>
                <div className="bar-track">
                  <div className="bar" style={{ width: `${(c.count / max) * 100}%` }} />
                </div>
                <span className="bar-val">{c.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>All Items ({items.length})</button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users ({users.length})</button>
      </div>

      {tab === 'items' && (
        <div className="card table-card">
          <input className="table-filter" placeholder="Filter items…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th><th>Type</th><th>Category</th><th>Posted by</th><th>Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i._id}>
                    <td><Link to={`/items/${i._id}`} className="link">{i.title}</Link></td>
                    <td><TypeBadge type={i.type} /></td>
                    <td>{i.category}</td>
                    <td>{i.postedBy?.name}</td>
                    <td>{formatDate(i.date)}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="actions">
                      <select value={i.status} onChange={(e) => setStatus(i._id, e.target.value)}>
                        <option value="open">Open</option>
                        <option value="claimed">Claimed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={() => removeItem(i._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>USN</th><th>Role</th><th>Reports</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.usn || '–'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-cat' : ''}`}>{u.role}</span></td>
                    <td>{u.itemCount}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className={`btn btn-sm ${u.isBlocked ? 'btn-found' : 'btn-danger'}`} onClick={() => toggleBlock(u)}>
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
