import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";

interface NavbarProps {
  count: number;
}

function getClass(state: { isActive: boolean }) {
  if (state.isActive) {
    return "nav-link active";
  }
  return "nav-link";
}

function Navbar(props: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const role = user ? user.role : "guest";

  return (
    <header className="navbar">
      <div className="topbar">
        <span>
          Emergency: <a href="tel:123">123</a>
        </span>
        <span>Reception: 02 2555 0100</span>
        <span>Open daily 8:00 to 20:00</span>
      </div>
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">+</span>
          <span className="brand-name">Nile Care Hospital</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={getClass}>
            Home
          </NavLink>
          <NavLink to="/clinics" className={getClass}>
            Clinics
          </NavLink>
          <NavLink to="/doctors" className={getClass}>
            Doctors
          </NavLink>

          {(role === "guest" || role === "patient") && (
            <NavLink to="/book" className={getClass}>
              Book
            </NavLink>
          )}

          {user && (
            <NavLink to="/dashboard" className={getClass}>
              Dashboard
            </NavLink>
          )}

          {role === "patient" && (
            <NavLink to="/appointments" className={getClass}>
              My appointments
              {props.count > 0 && <span className="badge">{props.count}</span>}
            </NavLink>
          )}
          {role === "patient" && (
            <NavLink to="/health-profile" className={getClass}>
              Health file
            </NavLink>
          )}

          {role === "doctor" && (
            <NavLink to="/appointments" className={getClass}>
              My patients
              {props.count > 0 && <span className="badge">{props.count}</span>}
            </NavLink>
          )}
          {role === "doctor" && (
            <NavLink to="/doctor/profile" className={getClass}>
              My profile
            </NavLink>
          )}

          {role === "admin" && (
            <NavLink to="/admin" className={getClass}>
              Admin
            </NavLink>
          )}

          {!user && (
            <NavLink to="/login" className={getClass}>
              Log in
            </NavLink>
          )}
          {!user && (
            <NavLink to="/register" className={getClass}>
              Sign up
            </NavLink>
          )}

          {user && (
            <div className="nav-user">
              <span className="nav-user-name">{user.fullName.replace("Dr. ", "")}</span>
              <span className="tag">{user.role}</span>
              <button className="nav-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
