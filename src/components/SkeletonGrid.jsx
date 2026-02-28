function SkeletonCard() {
  return (
    <div className="w-full overflow-hidden rounded-lg bg-[var(--panel)]" aria-hidden="true">
      <div className="h-[180px] w-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] md:h-[250px] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
      <div className="p-3">
        <div className="mb-2 h-3 w-[80%] rounded-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
        <div className="h-3 w-[55%] rounded-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]" aria-label="Loading movies">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`skeleton-grid-${index}`} />
      ))}
    </div>
  );
}
