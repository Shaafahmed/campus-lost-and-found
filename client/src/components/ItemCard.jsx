import { Link } from 'react-router-dom';
import { formatDate } from '../utils.js';

export function TypeBadge({ type }) {
  return <span className={`badge badge-${type}`}>{type === 'lost' ? 'Lost' : 'Found'}</span>;
}

export function StatusBadge({ status }) {
  const label = { open: 'Open', claimed: 'Claimed', resolved: 'Resolved' }[status] || status;
  return <span className={`badge status-${status}`}>{label}</span>;
}

export function ItemImage({ src, alt }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />;
  return (
    <div className="img-placeholder">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M21 16l-5-5-8 8" />
      </svg>
    </div>
  );
}

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item._id}`} className="item-card">
      <div className="item-card-img">
        <ItemImage src={item.image} alt={item.title} />
        <div className="item-card-badges">
          <TypeBadge type={item.type} />
          {item.status !== 'open' && <StatusBadge status={item.status} />}
        </div>
      </div>
      <div className="item-card-body">
        <div className="item-card-cat">{item.category}</div>
        <h3>{item.title}</h3>
        <div className="item-card-meta">
          <span>📍 {item.location}</span>
          <span>📅 {formatDate(item.date)}</span>
        </div>
      </div>
    </Link>
  );
}
