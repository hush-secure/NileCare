import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (user) {
    return <Navigate to={from || "/"} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (email.trim() === "" || password === "") {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const u = await login(email.trim(), password);
      if (from) {
        navigate(from, { replace: true });
      } else if (u.role === "doctor") {
        navigate(u.doctorId ? "/appointments" : "/doctor/profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section narrow">
      <h1 className="page-title">Log in</h1>
      <p className="page-subtitle">Welcome back. Log in to book and manage your appointments.</p>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error !== "" && <div className="error">{error}</div>}

        <button type="submit" className="btn btn-primary full" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
        <p className="muted small">
          No account yet? <Link className="link-button" to="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}

export default Login;
