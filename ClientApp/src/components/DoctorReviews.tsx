import { useEffect, useState } from "react";
import { fetchReviews } from "../api/services";
import { Review } from "../types";
import { Stars } from "./Stars";

function DoctorReviews(props: { doctorId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetchReviews(props.doctorId)
      .then(setReviews)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the reviews."))
      .finally(() => setLoading(false));
  }, [props.doctorId]);

  if (loading) {
    return <p className="muted small">Loading reviews...</p>;
  }
  if (error !== "") {
    return <div className="error">{error}</div>;
  }

  return (
    <ul className="reviews">
      {reviews.map((r) => (
        <li key={r.id}>
          <div className="review-head">
            <strong>{r.patientName}</strong>
            <Stars value={r.rating} />
            <span className="small">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          {r.comment !== "" && <p className="muted small">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}

export default DoctorReviews;
