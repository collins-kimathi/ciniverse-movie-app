function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton-poster" />
      <div className="card-info">
        <div className="skeleton-line w-80" />
        <div className="skeleton-line w-55" />
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid" aria-label="Loading movies">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`skeleton-grid-${index}`} />
      ))}
    </div>
  );
}
