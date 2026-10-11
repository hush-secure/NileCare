import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="section">
      <div className="empty">
        <h1 className="page-title">Page not found</h1>
        <p className="muted">The page you are looking for does not exist or was moved.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
