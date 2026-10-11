import { FormEvent, useEffect, useState } from "react";
import { fetchMyPatientProfile, saveMyPatientProfile } from "../api/services";
import { PatientProfile } from "../types";
import { Loader } from "./StateMessage";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY: PatientProfile = {
  dateOfBirth: "",
  gender: "",
  bloodType: "",
  allergies: "",
  chronicConditions: "",
  emergencyContact: ""
};

function HealthProfile() {
  const [form, setForm] = useState<PatientProfile>(EMPTY);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchMyPatientProfile()
      .then(setForm)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your health file."))
      .finally(() => setLoading(false));
  }, []);

  function update(field: keyof PatientProfile, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      setForm(await saveMyPatientProfile(form));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your health file.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <section className="section narrow">
      <h1 className="page-title">My health file</h1>
      <p className="page-subtitle">
        Your doctor sees this before the visit. It is stored encrypted and only doctors you booked with can open it.
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input id="dob" type="date" max={today} value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="blood">Blood type</label>
            <select id="blood" value={form.bloodType} onChange={(e) => update("bloodType", e.target.value)}>
              <option value="">Unknown</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="emergency">Emergency contact</label>
            <input
              id="emergency"
              type="text"
              placeholder="Name and phone number"
              value={form.emergencyContact}
              onChange={(e) => update("emergencyContact", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="allergies">Allergies</label>
          <textarea id="allergies" rows={2} placeholder="Medicines, food, anything else" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="chronic">Chronic conditions</label>
          <textarea id="chronic" rows={2} placeholder="Diabetes, blood pressure, asthma..." value={form.chronicConditions} onChange={(e) => update("chronicConditions", e.target.value)} />
        </div>

        {error !== "" && <div className="error">{error}</div>}
        {saved && <div className="notice">Your health file was saved.</div>}

        <button type="submit" className="btn btn-primary full" disabled={submitting}>
          {submitting ? "Saving..." : "Save health file"}
        </button>
      </form>
    </section>
  );
}

export default HealthProfile;
