// UI component: MovieGrid.
import { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";

export default function MovieGrid({
  movies = [],
  onSelect = () => {},
  limit,
  emptyMessage = "No movies to show.",
}) {
  const [visibleCount, setVisibleCount] = useState(limit ?? 24);
  const sentinelRef = useRef(null);
  const safeMovies = movies.filter((movie) => movie && movie.id);
  const visibleMovies = limit != null ? safeMovies.slice(0, limit) : safeMovies.slice(0, visibleCount);
  const canLoadMore = limit == null && visibleCount < safeMovies.length;

  useEffect(() => {
    setVisibleCount(limit ?? 24);
  }, [limit, movies.length]);

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + 24, safeMovies.length));
        }
      },
      { rootMargin: "260px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, safeMovies.length]);

  if (!visibleMovies.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="grid">
        {visibleMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={onSelect} />
        ))}
      </div>
      {canLoadMore ? <div ref={sentinelRef} className="render-sentinel" aria-hidden="true" /> : null}
    </>
  );
}
