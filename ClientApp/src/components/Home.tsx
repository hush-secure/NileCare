import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppData";
import { fetchReviews } from "../api/services";
import { Doctor, Review } from "../types";
import { getInitials, getSpecialtyIcon } from "../utils/doctors";
import { Stars } from "./Stars";

const FIRST_SPECIALTIES = 8;

interface Quote {
  review: Review;
  doctorName: string;
}

function PatientQuotes(props: { doctors: Doctor[] }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const doctorIds = props.doctors.map((d) => d.id).join(",");

  useEffect(() => {
    let cancelled = false;

    Promise.all(props.doctors.map((d) => fetchReviews(d.id).catch(() => [] as Review[]))).then((lists) => {
      if (cancelled) {
        return;
      }
      const found: Quote[] = [];
      for (let i = 0; i < lists.length; i++) {
        for (let j = 0; j < lists[i].length; j++) {
          const review = lists[i][j];
          if (review.rating >= 4 && review.comment !== "") {
            found.push({ review: review, doctorName: props.doctors[i].name });
            break;
          }
        }
      }
      setQuotes(found);
    });

    return () => {
      cancelled = true;
    };
  }, [doctorIds]);

  if (quotes.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <h2 className="section-title">What patients say</h2>
      <div className="grid three">
        {quotes.map((q) => (
          <div className="card quote" key={q.doctorName + q.review.id}>
            <Stars value={q.review.rating} />
            <p dir="auto">&ldquo;{q.review.comment}&rdquo;</p>
            <p className="small">
              {q.review.patientName} about {q.doctorName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { clinics, specialties, doctors } = useAppData();
  const navigate = useNavigate();

  const [specialtyId, setSpecialtyId] = useState<string>("0");
  const [showAll, setShowAll] = useState<boolean>(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (specialtyId === "0") {
      navigate("/doctors");
    } else {
      navigate("/doctors?specialty=" + specialtyId);
    }
  }

  function countDoctors(id: number) {
    return doctors.filter((d) => d.specialtyId === id).length;
  }

  let ratingSum = 0;
  let ratedDoctors = 0;
  for (let i = 0; i < doctors.length; i++) {
    if (doctors[i].reviewCount > 0) {
      ratingSum = ratingSum + doctors[i].rating;
      ratedDoctors = ratedDoctors + 1;
    }
  }
  const averageRating = ratedDoctors > 0 ? ratingSum / ratedDoctors : 0;

  const topDoctors = doctors
    .filter((d) => d.reviewCount >= 3)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 3);

  const shownSpecialties = showAll ? specialties : specialties.slice(0, FIRST_SPECIALTIES);

  return (
    <div>
      <section className="hero">
        <div className="hero-text">
          <h1>See the right doctor, at a time that suits you</h1>
          <p>
            Browse our clinics, compare doctors and book your visit in under a minute. No phone calls and no waiting
            in line at reception.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <div className="field grow">
              <label htmlFor="heroSpecialty">What do you need?</label>
              <select id="heroSpecialty" value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
                <option value="0">Any specialty</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">
              Find a doctor
            </button>
          </form>

          <div className="hero-buttons">
            <Link className="btn btn-secondary" to="/book">
              Book an appointment
            </Link>
            <Link className="btn btn-outline" to="/clinics">
              View clinics
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-stat">
            <span className="hero-number">{clinics.length}</span>
            <span className="hero-label">Specialist clinics</span>
          </div>
          <div className="hero-stat">
            <span className="hero-number">{doctors.length}</span>
            <span className="hero-label">Doctors on the team</span>
          </div>
          <div className="hero-stat">
            <span className="hero-number">{specialties.length}</span>
            <span className="hero-label">Medical specialties</span>
          </div>
          <div className="hero-stat">
            <span className="hero-number">{averageRating > 0 ? averageRating.toFixed(1) : "-"}</span>
            <span className="hero-label">Average patient rating</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Browse by specialty</h2>
        <div className="specialty-grid">
          {shownSpecialties.map((s) => (
            <Link className="specialty-card" key={s.id} to={"/doctors?specialty=" + s.id}>
              <span 
                className="specialty-icon" 
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: getSpecialtyIcon(s.name) }} 
              />
              <strong>{s.name}</strong>
              <span className="small">{countDoctors(s.id)} doctors</span>
            </Link>
          ))}
        </div>
        {specialties.length > FIRST_SPECIALTIES && (
          <div className="show-more">
            <button className="btn btn-outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show fewer specialties" : "Show all " + specialties.length + " specialties"}
            </button>
          </div>
        )}
      </section>

      {topDoctors.length > 0 && (
        <section className="section">
          <div className="card-top">
            <h2 className="section-title">Top rated doctors</h2>
            <Link className="link-button" to="/doctors">
              See all doctors
            </Link>
          </div>
          <div className="grid three">
            {topDoctors.map((doctor) => (
              <div className="card" key={doctor.id}>
                <div className="doctor-header">
                  <div className="avatar">{getInitials(doctor.name)}</div>
                  <div>
                    <h3>{doctor.name}</h3>
                    <span className="tag">{doctor.specialty}</span>
                  </div>
                </div>
                <div className="rating-row">
                  <Stars value={doctor.rating} />
                  <span className="small">
                    {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                  </span>
                </div>
                <p className="small">
                  {doctor.experience} years of experience · {doctor.fee} EGP
                </p>
                <Link className="btn btn-primary full" to={"/book?doctor=" + doctor.id}>
                  Book appointment
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">How it works</h2>
        <div className="grid three">
          <div className="card">
            <span className="step-number">1</span>
            <h3>Choose a doctor</h3>
            <p className="muted">Pick a specialty, compare ratings, fees and working days.</p>
          </div>
          <div className="card">
            <span className="step-number">2</span>
            <h3>Pick a time</h3>
            <p className="muted">See the free times of the doctor and reserve the one that suits you.</p>
          </div>
          <div className="card">
            <span className="step-number">3</span>
            <h3>Visit and rate</h3>
            <p className="muted">Come to the clinic, then tell other patients how your visit went.</p>
          </div>
        </div>
      </section>

      {topDoctors.length > 0 && <PatientQuotes doctors={topDoctors} />}

      <section className="help-strip">
        <div>
          <h3>Not sure which doctor you need?</h3>
          <p className="muted">
            Ask Noor, our assistant, in Arabic or English. Press the AI button at the bottom of the page. In an
            emergency call 123.
          </p>
        </div>
        <Link className="btn btn-outline" to="/doctors">
          Browse all doctors
        </Link>
      </section>
    </div>
  );
}

export default Home;
