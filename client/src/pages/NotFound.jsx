import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section center">
      <h1 className="page-title">404 – Page not found</h1>
      <p className="muted">Looks like this page got lost too.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
