interface LoaderProps {
  text?: string;
}

export function Loader(props: LoaderProps) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true"></span>
      <p className="muted">{props.text ? props.text : "Loading..."}</p>
    </div>
  );
}

interface ErrorMessageProps {
  text: string;
  onRetry?: () => void;
}

export function ErrorMessage(props: ErrorMessageProps) {
  return (
    <div className="empty">
      <h3>We could not load the data</h3>
      <p className="error">{props.text}</p>
      {props.onRetry && (
        <button className="btn btn-outline" onClick={props.onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
