export default function SkeletonRow({ title = "Loading..." }) {
  return (
    <section className="mb-8" aria-label="Loading movie row">
      <div className="mb-3">
        <h3 className="text-xl">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`skeleton-row-${index}`} className="w-full overflow-hidden rounded-lg bg-[var(--panel)]" aria-hidden="true">
            <div className="h-[180px] w-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] md:h-[250px] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
            <div className="p-3">
              <div className="mb-2 h-3 w-[80%] rounded-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
              <div className="h-3 w-[55%] rounded-full animate-[skeletonShimmer_1.2s_infinite_linear] bg-[length:300%_100%] [background-image:linear-gradient(90deg,#2a2b30_25%,#34363d_37%,#2a2b30_63%)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
