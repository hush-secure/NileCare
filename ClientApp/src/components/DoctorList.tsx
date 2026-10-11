import { ChangeEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { useAuth } from "../context/Auth";
import { Doctor } from "../types";
import { doctorWorksOn, getNowTime, getToday, WEEK_DAYS } from "../utils/dates";
import { getInitials } from "../utils/doctors";
import { Stars } from "./Stars";
import DoctorReviews from "./DoctorReviews"; 

type SortKey = "name" | "rating" | "experience" | "fee";

const PAGE_SIZE = 9; 

function DoctorList() {
  const { clinics, specialties, doctors, getClinicName } = useAppData();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("name");
  const [maxFee, setMaxFee] = useState<string>("0");
  const [minRating, setMinRating] = useState<string>("0");
  const [day, setDay] = useState<string>(""); 
  const [onlyToday, setOnlyToday] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [openReviews, setOpenReviews] = useState<number>(0);

  const today = getToday();
  const nowTime = getNowTime();

  const clinicId = Number(searchParams.get("clinic")) || 0;
  const specialtyId = Number(searchParams.get("specialty")) || 0;

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "0") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
    setVisibleCount(PAGE_SIZE);
  }

  function handleClinicChange(e: ChangeEvent<HTMLSelectElement>) {
    updateParam("clinic", e.target.value);
  }

  function worksToday(doctor: Doctor) {
    return doctorWorksOn(doctor.days, today) && doctor.endTime > nowTime;
  }

  function clearFilters() {
    setSearch("");
    setMaxFee("0");
    setMinRating("0");
    setDay("");
    setOnlyToday(false);
    setVisibleCount(PAGE_SIZE);
    setSearchParams(new URLSearchParams());
  }

  const feeLimit = Number(maxFee);
  const ratingLimit = Number(minRating);

  const hasFilters =
    search !== "" || maxFee !== "0" || minRating !== "0" || day !== "" || onlyToday || clinicId !== 0 || specialtyId !== 0;

  const inClinic = doctors.filter((d) => clinicId === 0 || d.clinicId === clinicId);

  const filteredDoctors = inClinic
    .filter((doctor) => {
      const text = search.toLowerCase();
      const matchesSpecialty = specialtyId === 0 || doctor.specialtyId === specialtyId;
      const matchesSearch =
        doctor.name.toLowerCase().includes(text) || doctor.specialty.toLowerCase().includes(text);
      const matchesFee = feeLimit === 0 || doctor.fee <= feeLimit;
      const matchesRating = ratingLimit === 0 || (doctor.reviewCount > 0 && doctor.rating >= ratingLimit);
      const matchesDay = day === "" || doctor.days.includes(day);
      const matchesToday = !onlyToday || worksToday(doctor);
      return matchesSpecialty && matchesSearch && matchesFee && matchesRating && matchesDay && matchesToday;
    })
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
      if (sort === "experience") return b.experience - a.experience;
      if (sort === "fee") return a.fee - b.fee;
      return a.name.localeCompare(b.name);
    });

  const shownDoctors = filteredDoctors.slice(0, visibleCount);

  return (
    <section className="section">
      <h1 className="page-title">Doctors</h1>
      <p className="page-subtitle">Compare our doctors and book the one that fits your needs.</p>

      <div className="chips" role="group" aria-label="Specialties">
        <button className={specialtyId === 0 ? "chip active" : "chip"} onClick={() => updateParam("specialty", "0")}>
          All specialties <span className="chip-count">{inClinic.length}</span>
        </button>
        {specialties.map((s) => {
          const count = inClinic.filter((d) => d.specialtyId === s.id).length;
          return (
            <button
              key={s.id}
              className={specialtyId === s.id ? "chip active" : "chip"}
              onClick={() => updateParam("specialty", String(s.id))}
            >
              {s.name} <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="filters">
        <div className="field">
          <label htmlFor="clinicFilter">Clinic</label>
          <select id="clinicFilter" value={clinicId} onChange={handleClinicChange}>
            <option value={0}>All clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="feeFilter">Consultation fee</label>
          <select
            id="feeFilter"
            value={maxFee}
            onChange={(e) => {
              setMaxFee(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="0">Any fee</option>
            <option value="300">Up to 300 EGP</option>
            <option value="500">Up to 500 EGP</option>
            <option value="700">Up to 700 EGP</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ratingFilter">Rating</label>
          <select
            id="ratingFilter"
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="0">Any rating</option>
            <option value="3">3 stars and up</option>
            <option value="4">4 stars and up</option>
            <option value="4.5">4.5 stars and up</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="dayFilter">Works on</label>
          <select
            id="dayFilter"
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">Any day</option>
            {WEEK_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sortBy">Sort by</label>
          <select id="sortBy" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="name">Name</option>
            <option value="rating">Top rated</option>
            <option value="experience">Most experienced</option>
            <option value="fee">Lowest fee</option>
          </select>
        </div>
        <div className="field grow">
          <label htmlFor="searchBox">Search</label>
          <input
            id="searchBox"
            type="text"
            placeholder="Doctor name or specialty"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
      </div>

      <div className="result-bar">
        <label className="check-inline">
          <input
            type="checkbox"
            checked={onlyToday}
            onChange={(e) => {
              setOnlyToday(e.target.checked);
              setVisibleCount(PAGE_SIZE);
            }}
          />
          Working today
        </label>
        <span className="small">
          Showing {shownDoctors.length} of {filteredDoctors.length} doctors
        </span>
        {hasFilters && (
          <button className="link-button link-reset" onClick={clearFilters}>
            Clear all filters
          </button>
        )}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="empty">
          <h3>No doctors found</h3>
          <p className="muted">Try another specialty, a higher fee limit or a different day.</p>
          {hasFilters && (
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="grid three">
        {shownDoctors.map((doctor) => (
          <div className="card" key={doctor.id}>
            <div className="doctor-header">
              <div className="avatar">{getInitials(doctor.name)}</div>
              <div>
                <h3>{doctor.name}</h3>
                <div className="tag-row">
                  <span className="tag">{doctor.specialty}</span>
                  {worksToday(doctor) && <span className="tag tag-live">Working today</span>}
                  {doctor.rating >= 4.5 && doctor.reviewCount >= 5 && <span className="tag tag-star">Top rated</span>}
                </div>
              </div>
            </div>
            <div className="rating-row">
              <Stars value={doctor.rating} />
              <span className="small">
                {doctor.reviewCount > 0
                  ? doctor.rating.toFixed(1) + " (" + doctor.reviewCount + (doctor.reviewCount === 1 ? " review)" : " reviews)")
                  : "No reviews yet"}
              </span>
            </div>
            {doctor.bio !== "" && <p className="muted small bio">{doctor.bio}</p>}
            <dl className="details">
              <div>
                <dt>Clinic</dt>
                <dd>{getClinicName(doctor.clinicId)}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{doctor.experience} years</dd>
              </div>
              <div>
                <dt>Working days</dt>
                <dd>{doctor.days}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>
                  {doctor.startTime} to {doctor.endTime}
                </dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{doctor.fee} EGP</dd>
              </div>
            </dl>
            {doctor.reviewCount > 0 && (
              <button
                className="link-button link-reset"
                onClick={() => setOpenReviews(openReviews === doctor.id ? 0 : doctor.id)}
              >
                {openReviews === doctor.id ? "Hide reviews" : "Read reviews"}
              </button>
            )}
            {openReviews === doctor.id && <DoctorReviews doctorId={doctor.id} />}
            {(!user || user.role === "patient") && (
              <Link className="btn btn-primary full" to={"/book?doctor=" + doctor.id}>
                Book appointment
              </Link>
            )}
          </div>
        ))}
      </div>

      {filteredDoctors.length > visibleCount && (
        <div className="show-more">
          <button className="btn btn-outline" onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}>
            Show more doctors ({filteredDoctors.length - visibleCount} left)
          </button>
        </div>
      )}
    </section>
  );
}

export default DoctorList;
