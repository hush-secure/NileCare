export function Stars(props: { value: number }) {
  const value = Math.max(0, Math.min(5, props.value));
  return (
    <span className="stars" role="img" aria-label={value.toFixed(1) + " out of 5 stars"}>
      <span className="stars-fill" style={{ width: (value / 5) * 100 + "%" }} aria-hidden="true">
        ★★★★★
      </span>
      <span aria-hidden="true">★★★★★</span>
    </span>
  );
}

export function StarInput(props: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={props.value === n}
          aria-label={n + (n === 1 ? " star" : " stars")}
          className={n <= props.value ? "star-btn on" : "star-btn"}
          onClick={() => props.onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
