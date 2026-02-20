import { useState } from "react";
import { fetchPopular } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import useMovies from "../hooks/useMovies";

export default function Popular() {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const { movies, loading, error } = useMovies(
    async () => {
      const requests = Array.from({ length: page }, (_, index) =>
        fetchPopular(index + 1)
      );
      const results = await Promise.all(requests);
      const uniqueById = new Map();

      results.forEach((data) => {
        (data.results || []).forEach((movie) => {
          if (movie?.id && !uniqueById.has(movie.id)) {
            uniqueById.set(movie.id, movie);
          }
        });
      });

      return Array.from(uniqueById.values());
    },
    [page],
    { errorMessage: "Could not load popular movies." }
  );

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Popular Movies</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <p className="status-line error">{error}</p> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No popular movies found." />
        ) : null}
        <div className="popular-actions">
          <button
            type="button"
            className="row-more-btn"
            onClick={() => setPage((current) => current + 1)}
            aria-label="Load more movies"
            title="Load more movies"
          >
            More Movies +
          </button>
        </div>
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
