import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { Doctor } from "../types";

function ClinicList() {
  const { clinics, doctors } = useAppData();
  const [search, setSearch] = useState<string>("");
  const [floor, setFloor] = useState<string>("");
  
  function countDoctors(clinicId: number) {
    let count = 0;
    for (let i = 0; i < doctors.length; i++) {
      if (doctors[i].clinicId === clinicId) {
        count = count + 1;
      }
    }
    return count;
  }

  function getTopDoctor(clinicId: number): Doctor | null {
    let best: Doctor | null = null;
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      if (doctor.clinicId !== clinicId || doctor.reviewCount === 0) {
        continue;
      }
      if (best === null || doctor.rating > best.rating) {
        best = doctor;
      }
    }
    return best;
  }

  const floors: string[] = [];
  for (let i = 0; i < clinics.length; i++) {
    if (!floors.includes(clinics[i].floor)) {
      floors.push(clinics[i].floor);
    }
  }
  floors.sort();

  const shownClinics = clinics.filter((clinic) => {
    const text = search.toLowerCase();
    const matchesSearch = clinic.name.toLowerCase().includes(text) || clinic.description.toLowerCase().includes(text);
    const matchesFloor = floor === "" || clinic.floor === floor;
    return matchesSearch && matchesFloor;
  });

  return (
    <section className="section">
      <h1 className="page-title">Clinics</h1>
      <p className="page-subtitle">Choose a clinic to see the doctors who work there.</p>

      <div className="chips" role="group" aria-label="Floors">
        <button className={floor === "" ? "chip active" : "chip"} onClick={() => setFloor("")}>
          All floors <span className="chip-count">{clinics.length}</span>
        </button>
        {floors.map((f) => (
          <button key={f} className={floor === f ? "chip active" : "chip"} onClick={() => setFloor(f)}>
            {f} <span className="chip-count">{clinics.filter((c) => c.floor === f).length}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="field grow">
          <label htmlFor="clinicSearch">Search</label>
          <input
            id="clinicSearch"
            type="text"
            placeholder="Clinic name or what it treats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {shownClinics.length === 0 && (
        <div className="empty">
          <h3>No clinics found</h3>
          <p className="muted">Try another floor or clear the search box.</p>
        </div>
      )}

      <div className="grid three">
        {shownClinics.map((clinic) => {
          const topDoctor = getTopDoctor(clinic.id);
          return (
            <div className="card" key={clinic.id}>
              <div className="card-top">
                <h3>{clinic.name}</h3>
                <span className="tag">{clinic.floor}</span>
              </div>
              <p className="muted">{clinic.description}</p>
              <p className="small">Phone: {clinic.phone}</p>
              {topDoctor && (
                <p className="small clinic-top">
                  Top rated: {topDoctor.name} ({topDoctor.rating.toFixed(1)} ★)
                </p>
              )}
              <div className="card-bottom">
                <span className="small">{countDoctors(clinic.id)} doctors</span>
                <Link className="btn btn-outline" to={"/doctors?clinic=" + clinic.id}>
                  View doctors
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ClinicList;
