import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard } from "../api/services";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { Appointment, Stat } from "../types";
import { formatDay, getNowTime, getToday } from "../utils/dates";
import { ErrorMessage, Loader } from "./StateMessage";

function Dashboard() {
  const { user } = useAuth();
  const { appointments, getDoctorName, getClinicName } = useAppData();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  function load() {
    setLoading(true);
    setError("");
    fetchDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the dashboard."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (!user) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }
  if (error !== "") {
    return <ErrorMessage text={error} onRetry={load} />;
  }

  const today = getToday();
  const nowTime = getNowTime();

  const upcoming = appointments
    .filter((a) => a.status === "booked" && (a.date > today || (a.date === today && a.time >= nowTime)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);

  const recent = appointments
    .filter((a) => a.status === "completed")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 3);

  const todaysVisits = appointments
    .filter((a) => a.status === "booked" && a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  function renderRow(a: Appointment, forDoctor: boolean) {
    return (
      <li className="list-row" key={a.id}>
        <span className="list-time">
          {forDoctor ? a.time : formatDay(a.date) + " " + a.time}
        </span>
        <span className="list-main">
          <strong>{forDoctor ? a.patientName : getDoctorName(a.doctorId)}</strong>
          <span className="small">
            {forDoctor ? (a.reason !== "" ? a.reason : "No reason written") : getClinicName(a.clinicId)}
          </span>
        </span>
        <span className={"status status-" + a.status}>{a.status}</span>
      </li>
    );
  }

  return (
    <section className="section">
      <h1 className="page-title">Hello, {user.fullName}</h1>
      <p className="page-subtitle">
        {user.role === "admin" && "Hospital overview."}
        {user.role === "doctor" && "Your schedule at a glance."}
        {user.role === "patient" && "Your visits at a glance."}
      </p>

      {user.role === "doctor" && !user.doctorId && (
        <div className="notice banner">
          You are not in the doctors list yet. <Link className="link-button" to="/doctor/profile">Complete your profile</Link>
        </div>
      )}

      <div className="stats">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {user.role === "doctor" && (
        <div className="panel">
          <h2 className="section-title">Today's schedule</h2>
          {todaysVisits.length === 0 && <p className="muted">No visits booked for today.</p>}
          <ul className="list">{todaysVisits.map((a) => renderRow(a, true))}</ul>
        </div>
      )}

      {user.role === "patient" && (
        <div className="panel-grid">
          <div className="panel">
            <h2 className="section-title">Upcoming visits</h2>
            {upcoming.length === 0 && (
              <p className="muted">
                Nothing booked yet. <Link className="link-button" to="/book">Book a visit</Link>
              </p>
            )}
            <ul className="list">{upcoming.map((a) => renderRow(a, false))}</ul>
          </div>
          <div className="panel">
            <h2 className="section-title">Recent visits</h2>
            {recent.length === 0 && <p className="muted">Your completed visits will show here.</p>}
            <ul className="list">{recent.map((a) => renderRow(a, false))}</ul>
          </div>
        </div>
      )}

      <h2 className="section-title spaced">Quick actions</h2>
      <div className="button-row left">
        {user.role === "patient" && (
          <>
            <Link className="btn btn-primary" to="/book">Book an appointment</Link>
            <Link className="btn btn-outline" to="/appointments">My appointments</Link>
            <Link className="btn btn-outline" to="/health-profile">My health file</Link>
          </>
        )}
        {user.role === "doctor" && (
          <>
            <Link className="btn btn-primary" to="/appointments">My patients</Link>
            <Link className="btn btn-outline" to="/doctor/profile">Edit my profile</Link>
          </>
        )}
        {user.role === "admin" && (
          <Link className="btn btn-primary" to="/admin">Open admin panel</Link>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
