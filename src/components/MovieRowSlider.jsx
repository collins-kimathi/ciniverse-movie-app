import { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";

export default function MovieRowSlider({
  title,
  movies = [],
  onSelect = () => {},
  emptyMessage = "No movies to show.",
  onTitleClick,
}) {
  // Show an initial chunk and reveal more on demand.
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
    <section className="rail-section">
      <div className="row-head">
        <h3>{title}</h3>
        <div className="row-head-actions">
          {onTitleClick ? (
            <button type="button" className="row-link-btn" onClick={onTitleClick}>
              View All
            </button>
          ) : null}
          {canLoadMore ? (
            <button type="button" className="row-more-btn" onClick={loadMore}>
              More Movies
            </button>
          ) : null}
        </div>
      </div>

      {!visibleMovies.length ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="row-slider-grid">
          {visibleMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={onSelect} />
          ))}
        </div>
      )}
      {canLoadMore ? <div ref={sentinelRef} className="render-sentinel" aria-hidden="true" /> : null}
    </section>
  );
}
