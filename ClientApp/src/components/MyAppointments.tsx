import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { fetchPatientProfileForVisit } from "../api/services";
import { Appointment, PatientProfile } from "../types";
import { formatDay, getNowTime, getToday } from "../utils/dates";
import { StarInput, Stars } from "./Stars";

type Filter = "all" | "booked" | "completed" | "cancelled";
type SortMode = "upcoming" | "newest" | "oldest";

const PAGE_SIZE = 9;

interface CardProps {
  appointment: Appointment;
  isDoctor: boolean;
  onError: (message: string) => void;
}

function AppointmentCard(props: CardProps) {
  const { appointment, isDoctor, onError } = props;
  const { cancelAppointment, completeAppointment, rateAppointment, getClinicName, getDoctorName } = useAppData();

  const [busy, setBusy] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [prescription, setPrescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [rateOpen, setRateOpen] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");

  const today = getToday();
  const isBooked = appointment.status === "booked";
  const canComplete = isDoctor && isBooked && appointment.date <= today;

  async function handleCancel() {
    if (!window.confirm("Do you want to cancel this appointment?")) {
      return;
    }
    setBusy(true);
    onError("");
    try {
      await cancelAppointment(appointment.id);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not cancel the appointment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (diagnosis.trim().length < 2) {
      onError("Please write the diagnosis.");
      return;
    }
    setBusy(true);
    onError("");
    try {
      await completeAppointment(appointment.id, { diagnosis, prescription, notes });
      setCompleting(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not complete the visit.");
    } finally {
      setBusy(false);
    }
  }

  async function handleProfile() {
    if (profile) {
      setProfile(null);
      return;
    }
    setBusy(true);
    onError("");
    try {
      setProfile(await fetchPatientProfileForVisit(appointment.id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load the health file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRate() {
    if (stars === 0) {
      onError("Choose a rating from 1 to 5 stars.");
      return;
    }
    setBusy(true);
    onError("");
    try {
      await rateAppointment(appointment.id, stars, reviewText.trim());
      setRateOpen(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save your rating.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card appt">
      <div className="card-top">
        <h3>
          {appointment.date} <span className="appt-time">{appointment.time}</span>
        </h3>
        <span className={"status status-" + appointment.status}>{appointment.status}</span>
      </div>

      <dl className="details">
        {!isDoctor && (
          <div>
            <dt>Doctor</dt>
            <dd>{getDoctorName(appointment.doctorId)}</dd>
          </div>
        )}
        <div>
          <dt>Clinic</dt>
          <dd>{getClinicName(appointment.clinicId)}</dd>
        </div>
        <div>
          <dt>Patient</dt>
          <dd>{appointment.patientName}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{appointment.phone}</dd>
        </div>
      </dl>

      {appointment.reason !== "" && (
        <p className="small">
          <strong>Reason:</strong> {appointment.reason}
        </p>
      )}

      {appointment.status === "completed" && (
        <div className="notice">
          <p>
            <strong>Diagnosis:</strong> {appointment.diagnosis}
          </p>
          {appointment.prescription !== "" && (
            <p>
              <strong>Prescription:</strong> {appointment.prescription}
            </p>
          )}
          {isDoctor && appointment.doctorNotes !== "" && (
            <p>
              <strong>Private notes:</strong> {appointment.doctorNotes}
            </p>
          )}
        </div>
      )}

      {appointment.status === "completed" && appointment.rating > 0 && (
        <p className="small rating-row">
          <strong>{isDoctor ? "Patient rating:" : "Your rating:"}</strong> <Stars value={appointment.rating} />
        </p>
      )}

      {!isDoctor && appointment.status === "completed" && appointment.rating === 0 && (
        rateOpen ? (
          <div className="complete-form">
            <div className="field">
              <label>How was your visit?</label>
              <StarInput value={stars} onChange={setStars} />
            </div>
            <div className="field">
              <label htmlFor={"rv" + appointment.id}>Comment (optional)</label>
              <textarea
                id={"rv" + appointment.id}
                rows={2}
                maxLength={500}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
            <div className="button-row">
              <button className="btn btn-primary" disabled={busy || stars === 0} onClick={handleRate}>
                Submit rating
              </button>
              <button className="btn btn-outline" disabled={busy} onClick={() => setRateOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setRateOpen(true)}>
            Rate this visit
          </button>
        )
      )}

      {profile && (
        <div className="notice">
          <p>
            <strong>Date of birth:</strong> {profile.dateOfBirth || "-"} | <strong>Gender:</strong>{" "}
            {profile.gender || "-"} | <strong>Blood type:</strong> {profile.bloodType || "-"}
          </p>
          <p>
            <strong>Allergies:</strong> {profile.allergies || "None recorded"}
          </p>
          <p>
            <strong>Chronic conditions:</strong> {profile.chronicConditions || "None recorded"}
          </p>
          <p>
            <strong>Emergency contact:</strong> {profile.emergencyContact || "-"}
          </p>
        </div>
      )}

      {completing && (
        <div className="complete-form">
          <div className="field">
            <label htmlFor={"dx" + appointment.id}>Diagnosis</label>
            <textarea id={"dx" + appointment.id} rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={"rx" + appointment.id}>Prescription</label>
            <textarea id={"rx" + appointment.id} rows={2} value={prescription} onChange={(e) => setPrescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={"nt" + appointment.id}>Private notes (only you can see them)</label>
            <textarea id={"nt" + appointment.id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="button-row">
            <button className="btn btn-primary" disabled={busy} onClick={handleComplete}>
              Save and complete visit
            </button>
            <button className="btn btn-outline" disabled={busy} onClick={() => setCompleting(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="card-actions">
        {isDoctor && (
          <button className="btn btn-outline" disabled={busy} onClick={handleProfile}>
            {profile ? "Hide health file" : "Patient health file"}
          </button>
        )}
        {canComplete && !completing && (
          <button className="btn btn-secondary" disabled={busy} onClick={() => setCompleting(true)}>
            Complete visit
          </button>
        )}
        {isBooked && (
          <button className="btn btn-danger" disabled={busy} onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function findNextVisit(list: Appointment[]): Appointment | null {
  const today = getToday();
  const nowTime = getNowTime();
  let next: Appointment | null = null;

  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.status !== "booked") {
      continue;
    }
    const alreadyPassed = a.date < today || (a.date === today && a.time < nowTime);
    if (alreadyPassed) {
      continue;
    }
    if (next === null || a.date + a.time < next.date + next.time) {
      next = a;
    }
  }
  return next;
}

function byOldestFirst(a: Appointment, b: Appointment) {
  return (a.date + a.time).localeCompare(b.date + b.time);
}

function byNewestFirst(a: Appointment, b: Appointment) {
  return (b.date + b.time).localeCompare(a.date + a.time);
}

function sortAppointments(list: Appointment[], mode: SortMode): Appointment[] {
  const copy = [...list];
  if (mode === "oldest") {
    return copy.sort(byOldestFirst);
  }
  if (mode === "newest") {
    return copy.sort(byNewestFirst);
  }
  const today = getToday();
  const upcoming = copy.filter((a) => a.status === "booked" && a.date >= today).sort(byOldestFirst);
  const others = copy.filter((a) => !(a.status === "booked" && a.date >= today)).sort(byNewestFirst);
  return upcoming.concat(others);
}

function MyAppointments() {
  const { appointments, getDoctorName, getClinicName } = useAppData();
  const { user } = useAuth();
  const isDoctor = user !== null && user.role === "doctor";

  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("upcoming");
  const [search, setSearch] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [error, setError] = useState<string>("");

  const today = getToday();
  const nextVisit = isDoctor ? null : findNextVisit(appointments);
  const todayCount = appointments.filter((a) => a.status === "booked" && a.date === today).length;

  const text = search.toLowerCase();
  const matching = appointments.filter((a) => {
    const matchesStatus = filter === "all" || a.status === filter;
    const matchesSearch =
      text === "" ||
      getDoctorName(a.doctorId).toLowerCase().includes(text) ||
      getClinicName(a.clinicId).toLowerCase().includes(text) ||
      a.patientName.toLowerCase().includes(text) ||
      a.reason.toLowerCase().includes(text) ||
      a.date.includes(text);
    return matchesStatus && matchesSearch;
  });
  const sorted = sortAppointments(matching, sortMode);
  const shown = sorted.slice(0, visibleCount);

  const filters: Filter[] = ["all", "booked", "completed", "cancelled"];

  return (
    <section className="section">
      <h1 className="page-title">{isDoctor ? "My patients" : "My appointments"}</h1>
      <p className="page-subtitle">
        {isDoctor ? "Everyone who booked a visit with you." : "All the visits you have booked."}
      </p>

      {nextVisit && (
        <div className="next-visit">
          <span className="tag">Next visit</span>
          <h3>
            {formatDay(nextVisit.date)} at {nextVisit.time}
          </h3>
          <p className="muted">
            {getDoctorName(nextVisit.doctorId)} · {getClinicName(nextVisit.clinicId)}. Please arrive 15 minutes early.
          </p>
        </div>
      )}
      {isDoctor && todayCount > 0 && (
        <div className="notice banner">
          You have {todayCount} {todayCount === 1 ? "visit" : "visits"} today.
        </div>
      )}

      <div className="chips" role="group" aria-label="Status filter">
        {filters.map((f) => (
          <button
            key={f}
            className={filter === f ? "chip active" : "chip"}
            onClick={() => {
              setFilter(f);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="chip-count">
              {f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="field grow">
          <label htmlFor="apptSearch">Search</label>
          <input
            id="apptSearch"
            type="text"
            placeholder={isDoctor ? "Patient name, reason or date" : "Doctor, clinic, reason or date"}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="apptSort">Sort by</label>
          <select id="apptSort" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="upcoming">Upcoming first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {error !== "" && <div className="error">{error}</div>}

      {shown.length === 0 && (
        <div className="empty">
          <h3>{isDoctor ? "No visits here yet" : "No appointments here yet"}</h3>
          <p className="muted">
            {isDoctor ? "New bookings will show up here." : "Pick a doctor and reserve your first visit."}
          </p>
          {!isDoctor && (
            <Link className="btn btn-primary" to="/book">
              Book an appointment
            </Link>
          )}
        </div>
      )}

      <div className="grid three">
        {shown.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} isDoctor={isDoctor} onError={setError} />
        ))}
      </div>

      {sorted.length > visibleCount && (
        <div className="show-more">
          <button className="btn btn-outline" onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}>
            Show more visits ({sorted.length - visibleCount} left)
          </button>
        </div>
      )}
    </section>
  );
}

export default MyAppointments;
