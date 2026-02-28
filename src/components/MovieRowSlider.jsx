import { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";

export default function MovieRowSlider({
  title,
  movies = [],
  onSelect = () => {},
  emptyMessage = "No movies to show.",
  onTitleClick,
}) {
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef(null);

  const safeMovies = movies.filter((movie) => movie && movie.id);
  const visibleMovies = safeMovies.slice(0, visibleCount);
  const canLoadMore = visibleCount < safeMovies.length;

  useEffect(() => {
    setVisibleCount(12);
  }, [title]);

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + 12, safeMovies.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, safeMovies.length]);

  function loadMore() {
    setVisibleCount((current) => current + 12);
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-3">
        <h3 className="text-xl">{title}</h3>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {onTitleClick ? (
            <button
              type="button"
              className="cursor-pointer rounded-full border border-[rgba(229,9,20,0.4)] bg-[rgba(229,9,20,0.14)] px-3 py-1.5 text-sm font-semibold text-[var(--text)]"
              onClick={onTitleClick}
            >
              View All
            </button>
          ) : null}
          {canLoadMore ? (
            <button
              type="button"
              className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18"
              onClick={loadMore}
            >
              More Movies
            </button>
          ) : null}
        </div>
      </div>

      {!visibleMovies.length ? (
        <p className="my-2 text-[var(--muted)]">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6">
          {visibleMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={onSelect} />
          ))}
        </div>
      )}
      {canLoadMore ? <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" /> : null}
    </section>
  );
}
