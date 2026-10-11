import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { RegisterData } from "../types";

type SignupRole = RegisterData["role"];

function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<SignupRole>("patient");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (fullName.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email.");
      return;
    }
    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters with letters and numbers.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const u = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        role: role
      });
      navigate(u.role === "doctor" ? "/doctor/profile" : "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section narrow">
      <h1 className="page-title">Create an account</h1>
      <p className="page-subtitle">Choose how you will use Nile Care Hospital.</p>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="role-switch" role="radiogroup" aria-label="Account type">
          <button
            type="button"
            className={role === "patient" ? "role-option active" : "role-option"}
            onClick={() => setRole("patient")}
          >
            I am a patient
          </button>
          <button
            type="button"
            className={role === "doctor" ? "role-option active" : "role-option"}
            onClick={() => setRole("doctor")}
          >
            I am a doctor
          </button>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters, letters and numbers"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error !== "" && <div className="error">{error}</div>}

        <button type="submit" className="btn btn-primary full" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
        <p className="muted small">
          Already have an account? <Link className="link-button" to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}

export default Register;
