export default function SectionError({ message, onRetry }) {
  return (
    <div className="section-error">
      <p className="status-line error">{message}</p>
      <button type="button" className="row-more-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
