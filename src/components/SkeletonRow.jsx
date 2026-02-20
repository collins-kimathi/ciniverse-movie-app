export default function SkeletonRow({ title = "Loading..." }) {
  return (
    <section className="rail-section" aria-label="Loading movie row">
      <div className="row-head">
        <h3>{title}</h3>
      </div>
      <div className="row-slider-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`skeleton-row-${index}`} className="card skeleton-card" aria-hidden="true">
            <div className="skeleton-poster" />
            <div className="card-info">
              <div className="skeleton-line w-80" />
              <div className="skeleton-line w-55" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
