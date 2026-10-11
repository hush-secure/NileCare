import "./theme"; 
import "./App.css";
import "./auth.css";
import "./pro.css";
import "./extras.css";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useAppData } from "./context/AppData";
import { useAuth } from "./context/Auth";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import ClinicList from "./components/ClinicList";
import DoctorList from "./components/DoctorList";
import BookingForm from "./components/BookingForm";
import MyAppointments from "./components/MyAppointments";
import NotFound from "./components/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import Login from "./components/Login";
import Register from "./components/Register";
import DoctorProfile from "./components/DoctorProfile";
import HealthProfile from "./components/HealthProfile";
import Dashboard from "./components/Dashboard";
import Admin from "./components/Admin";
import RequireRole from "./components/RequireRole";
import AssistantWidget from "./components/AssistantWidget";
import { ErrorMessage, Loader } from "./components/StateMessage";

function App() {
  const { appointments, loading, error, reload } = useAppData();
  const { checking, user } = useAuth();
  const location = useLocation();

  let content;

  if (checking || loading) {
    content = <Loader />;
  } else if (error !== "") {
    content = <ErrorMessage text={error} onRetry={reload} />;
  } else {
    content = (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clinics" element={<ClinicList />} />
        <Route path="/doctors" element={<DoctorList />} />
        {/* key: remount the form when the preselected doctor in the URL changes */}
        <Route
          path="/book"
          element={
            <RequireRole role="patient">
              <BookingForm key={location.search} />
            </RequireRole>
          }
        />
        <Route
          path="/appointments"
          element={
            <RequireRole>
              <MyAppointments />
            </RequireRole>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireRole>
              <Dashboard />
            </RequireRole>
          }
        />
        <Route
          path="/health-profile"
          element={
            <RequireRole role="patient">
              <HealthProfile />
            </RequireRole>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <RequireRole role="doctor">
              <DoctorProfile />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <Admin />
            </RequireRole>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar count={user && user.role !== "admin" ? appointments.filter((a) => a.status === "booked").length : 0} />
      <main className="main">{content}</main>
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <p className="footer-title">Nile Care Hospital</p>
            <p>Doctors, clinics and online booking in one place.</p>
          </div>
          <div>
            <p className="footer-title">Quick links</p>
            <ul className="footer-links">
              <li>
                <Link to="/doctors">Find a doctor</Link>
              </li>
              <li>
                <Link to="/clinics">Our clinics</Link>
              </li>
              <li>
                <Link to="/book">Book an appointment</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="footer-title">Contact</p>
            <p>Emergency: 123</p>
            <p>Reception: 02 2555 0100</p>
            <p>Open daily 8:00 to 20:00</p>
          </div>
        </div>
        <p className="footer-bottom">&copy; {new Date().getFullYear()} Nile Care Hospital. Demo website.</p>
      </footer>
      <AssistantWidget />
    </div>
  );
}

export default App;
