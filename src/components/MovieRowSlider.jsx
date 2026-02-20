import { useState } from "react";
import MovieCard from "./MovieCard";

export default function MovieRowSlider({
  title,
  movies = [],
  onSelect = () => {},
  emptyMessage = "No movies to show.",
}) {
  // Show an initial chunk and reveal more on demand.
  const [visibleCount, setVisibleCount] = useState(12);

  const safeMovies = movies.filter((movie) => movie && movie.id);
  const visibleMovies = safeMovies.slice(0, visibleCount);
  const canLoadMore = visibleCount < safeMovies.length;

  function loadMore() {
    setVisibleCount((current) => current + 12);
  }

  return (
    <section className="rail-section">
      <div className="row-head">
        <h3>{title}</h3>
        {canLoadMore ? (
          <button type="button" className="row-more-btn" onClick={loadMore}>
            More Movies
          </button>
        ) : null}
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
    </section>
  );
}
