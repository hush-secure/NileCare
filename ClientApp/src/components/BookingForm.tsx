import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { fetchSlots } from "../api/services";
import { ApiError } from "../api/client";
import { Appointment, TimeSlot } from "../types";
import { doctorWorksOn, formatDay, getNextDays, getNowTime, getToday } from "../utils/dates";
import { getInitials } from "../utils/doctors";
import { Loader } from "./StateMessage";
import { Stars } from "./Stars";

const REASONS = ["Check-up", "Follow-up visit", "New problem", "Second opinion", "Test results"];

function BookingForm() {
  const { clinics, doctors, addAppointment, getClinicName, getDoctorName } = useAppData();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const startDoctor = doctors.find((d) => d.id === Number(searchParams.get("doctor")));

  const [clinicId, setClinicId] = useState<number>(startDoctor ? startDoctor.clinicId : 0);
  const [doctorId, setDoctorId] = useState<number>(startDoctor ? startDoctor.id : 0);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [patientName, setPatientName] = useState<string>(user ? user.fullName : "");
  const [phone, setPhone] = useState<string>(user ? user.phone : "");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string>("");
  const [slotsRefresh, setSlotsRefresh] = useState<number>(0);

  const today = getToday();
  const nowTime = getNowTime();
  const nextDays = getNextDays(10);
  const doctorsInClinic = doctors.filter((d) => d.clinicId === clinicId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const canPickTime = doctorId !== 0 && date !== "";

  function isPastTime(slotTime: string) {
    return date === today && slotTime <= nowTime;
  }

  useEffect(() => {
    if (doctorId === 0 || date === "") {
      setSlots([]);
      setSlotsError("");
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");

    fetchSlots(doctorId, date)
      .then((list) => {
        if (cancelled) return;
        setSlots(list);
        setTime((current) => (list.some((s) => s.time === current && s.available) ? current : ""));
      })
      .catch((e) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(e instanceof Error ? e.message : "Could not load the available times.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [doctorId, date, slotsRefresh]);

  function handleClinicChange(e: ChangeEvent<HTMLSelectElement>) {
    setClinicId(Number(e.target.value));
    setDoctorId(0);
    setTime("");
    setError("");
  }

  function handleDoctorChange(e: ChangeEvent<HTMLSelectElement>) {
    setDoctorId(Number(e.target.value));
    setTime("");
    setError("");
  }

  function chooseDate(newDate: string) {
    setDate(newDate);
    setTime("");
    setError("");
  }

  function resetForm() {
    setClinicId(0);
    setDoctorId(0);
    setDate("");
    setTime("");
    setPatientName("");
    setPhone("");
    setReason("");
    setError("");
    setConfirmed(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (clinicId === 0) {
      setError("Please choose a clinic.");
      return;
    }
    if (doctorId === 0) {
      setError("Please choose a doctor.");
      return;
    }
    if (date === "") {
      setError("Please choose a date.");
      return;
    }
    if (date < today) {
      setError("The date cannot be in the past.");
      return;
    }
    if (time === "") {
      setError("Please choose a time.");
      return;
    }
    if (isPastTime(time)) {
      setError("This time has already passed. Please choose a later time.");
      return;
    }
    if (patientName.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await addAppointment({
        patientName: patientName.trim(),
        phone: phone.trim(),
        clinicId: clinicId,
        doctorId: doctorId,
        date: date,
        time: time,
        reason: reason.trim()
      });
      setConfirmed(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book the appointment.");
      if (err instanceof ApiError && err.status === 409) {
        setTime("");
        setSlotsRefresh((n) => n + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <section className="section narrow">
        <div className="card success">
          <div className="success-mark">✓</div>
          <h1 className="page-title">Appointment confirmed</h1>
          <p className="muted">Please arrive 15 minutes early and bring a photo ID.</p>
          <dl className="details summary">
            <div>
              <dt>Patient</dt>
              <dd>{confirmed.patientName}</dd>
            </div>
            <div>
              <dt>Clinic</dt>
              <dd>{getClinicName(confirmed.clinicId)}</dd>
            </div>
            <div>
              <dt>Doctor</dt>
              <dd>{getDoctorName(confirmed.doctorId)}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDay(confirmed.date)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{confirmed.time}</dd>
            </div>
          </dl>
          <div className="button-row">
            <Link className="btn btn-primary" to="/appointments">
              View my appointments
            </Link>
            <button className="btn btn-outline" onClick={resetForm}>
              Book another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section narrow">
      <h1 className="page-title">Book an appointment</h1>
      <p className="page-subtitle">Fill in the details below and we will reserve your slot right away.</p>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="clinic">Clinic</label>
            <select id="clinic" value={clinicId} onChange={handleClinicChange}>
              <option value={0}>Select a clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="doctor">Doctor</label>
            <select id="doctor" value={doctorId} onChange={handleDoctorChange} disabled={clinicId === 0}>
              <option value={0}>{clinicId === 0 ? "Choose a clinic first" : "Select a doctor"}</option>
              {doctorsInClinic.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedDoctor && (
          <div className="doctor-summary">
            <div className="avatar">{getInitials(selectedDoctor.name)}</div>
            <div>
              <strong>{selectedDoctor.name}</strong>
              <p className="small">
                {selectedDoctor.specialty} · {selectedDoctor.experience} years · {selectedDoctor.fee} EGP
              </p>
              <div className="rating-row">
                <Stars value={selectedDoctor.rating} />
                <span className="small">
                  {selectedDoctor.reviewCount > 0
                    ? selectedDoctor.rating.toFixed(1) + " (" + selectedDoctor.reviewCount + " reviews)"
                    : "No reviews yet"}
                </span>
              </div>
              <p className="small">
                Works {selectedDoctor.days}, {selectedDoctor.startTime} to {selectedDoctor.endTime}
              </p>
            </div>
          </div>
        )}

        <div className="field">
          <label>Choose a day</label>
          <div className="chips day-chips" role="group" aria-label="Next days">
            {nextDays.map((day) => {
              const works = selectedDoctor === undefined || doctorWorksOn(selectedDoctor.days, day);
              return (
                <button
                  key={day}
                  type="button"
                  className={date === day ? "chip active" : "chip"}
                  disabled={!works}
                  onClick={() => chooseDate(day)}
                >
                  {day === today ? "Today" : formatDay(day)}
                </button>
              );
            })}
          </div>
          <label htmlFor="date">Or pick another date</label>
          <input id="date" type="date" min={today} value={date} onChange={(e) => chooseDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Choose a time</label>
          {!canPickTime && <p className="muted small">Choose a doctor and a day first.</p>}
          {canPickTime && slotsLoading && <Loader text="Checking available times..." />}
          {canPickTime && !slotsLoading && slotsError === "" && slots.length === 0 && (
            <p className="muted small">The doctor has no times on this day. Try another day.</p>
          )}
          <div className="slot-grid" role="group" aria-label="Available times">
            {slots.map((slot) => {
              const disabled = !slot.available || isPastTime(slot.time);
              let className = "slot";
              if (time === slot.time) {
                className = "slot selected";
              }
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={className}
                  disabled={disabled}
                  onClick={() => {
                    setTime(slot.time);
                    setError("");
                  }}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
          {slots.length > 0 && <p className="small">Greyed times are already booked or have passed.</p>}
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="patientName">Full name</label>
            <input
              id="patientName"
              type="text"
              placeholder="Your full name"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="reason">Reason for the visit (optional)</label>
          <div className="chips reason-chips">
            {REASONS.map((r) => (
              <button key={r} type="button" className={reason === r ? "chip active" : "chip"} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
          <textarea
            id="reason"
            rows={2}
            maxLength={500}
            placeholder="Briefly describe your symptoms or why you are coming"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {slotsError !== "" && <div className="error">{slotsError}</div>}
        {error !== "" && <div className="error">{error}</div>}

        <button type="submit" className="btn btn-primary full" disabled={submitting}>
          {submitting ? "Booking..." : "Confirm appointment"}
        </button>
      </form>
    </section>
  );
}

export default BookingForm;
