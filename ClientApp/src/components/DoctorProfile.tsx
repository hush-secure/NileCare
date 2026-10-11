import { FormEvent, useState } from "react";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { saveDoctorProfile } from "../api/services";

const DAY_NAMES = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function DoctorProfile() {
  const { user, refreshUser } = useAuth();
  const { clinics, specialties, doctors, refreshCatalog } = useAppData();

  const existing = doctors.find((d) => user !== null && d.id === user.doctorId);

  const [name, setName] = useState<string>(existing ? existing.name : user ? "Dr. " + user.fullName : "");
  const [clinicId, setClinicId] = useState<number>(existing ? existing.clinicId : 0);
  const [specialtyId, setSpecialtyId] = useState<number>(existing ? existing.specialtyId : 0);
  const [experience, setExperience] = useState<string>(existing ? String(existing.experience) : "");
  const [fee, setFee] = useState<string>(existing ? String(existing.fee) : "");
  const [days, setDays] = useState<string[]>(existing ? existing.days.split(",").map((d) => d.trim()) : []);
  const [startTime, setStartTime] = useState<string>(existing ? existing.startTime : "09:00");
  const [endTime, setEndTime] = useState<string>(existing ? existing.endTime : "17:00");
  const [bio, setBio] = useState<string>(existing ? existing.bio : "");
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  function toggleDay(day: string) {
    setDays((list) => (list.includes(day) ? list.filter((d) => d !== day) : [...list, day]));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);

    if (name.trim().length < 3) {
      setError("Please enter your name.");
      return;
    }
    if (clinicId === 0) {
      setError("Please choose your clinic.");
      return;
    }
    if (specialtyId === 0) {
      setError("Please choose your specialty.");
      return;
    }
    if (experience === "" || Number(experience) < 0) {
      setError("Please enter your years of experience.");
      return;
    }
    if (fee === "" || Number(fee) < 0) {
      setError("Please enter your consultation fee.");
      return;
    }
    if (days.length === 0) {
      setError("Choose at least one working day.");
      return;
    }
    if (startTime === "" || endTime === "" || startTime >= endTime) {
      setError("The end of your working hours must be after the start.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await saveDoctorProfile({
        name: name.trim(),
        clinicId: clinicId,
        specialtyId: specialtyId,
        experience: Number(experience),
        fee: Number(fee),
        days: DAY_NAMES.filter((d) => days.includes(d)).join(", "),
        startTime: startTime,
        endTime: endTime,
        bio: bio.trim()
      });
      await refreshCatalog();
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section narrow">
      <h1 className="page-title">{existing ? "My profile" : "Set up your doctor profile"}</h1>
      <p className="page-subtitle">
        {existing
          ? "Patients see these details in the doctors list."
          : "Save your details to appear in the doctors list and start receiving bookings."}
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="docName">Name shown to patients</label>
            <input id="docName" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="docClinic">Clinic</label>
            <select id="docClinic" value={clinicId} onChange={(e) => setClinicId(Number(e.target.value))}>
              <option value={0}>Select a clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="docSpecialty">Specialty</label>
            <select id="docSpecialty" value={specialtyId} onChange={(e) => setSpecialtyId(Number(e.target.value))}>
              <option value={0}>Select a specialty</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="docExperience">Years of experience</label>
            <input
              id="docExperience"
              type="number"
              min={0}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="docFee">Consultation fee (EGP)</label>
            <input id="docFee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="docStart">Working hours (30 minute slots)</label>
            <div className="inline-fields">
              <input id="docStart" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <span className="muted">to</span>
              <input type="time" aria-label="End time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="field">
          <label>Working days</label>
          <div className="check-group">
            {DAY_NAMES.map((day) => (
              <label key={day} className="check">
                <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="docBio">About you (optional)</label>
          <textarea
            id="docBio"
            rows={3}
            maxLength={500}
            placeholder="A short introduction patients will see on your card"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {error !== "" && <div className="error">{error}</div>}
        {saved && <div className="notice">Profile saved. You now appear in the doctors list.</div>}

        <button type="submit" className="btn btn-primary full" disabled={submitting}>
          {submitting ? "Saving..." : existing ? "Save changes" : "Save and publish my profile"}
        </button>
      </form>
    </section>
  );
}

export default DoctorProfile;
