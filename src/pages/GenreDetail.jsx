import { useEffect, useState } from "react";
import { fetchByGenre } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import useMovies from "../hooks/useMovies";
import SectionError from "../components/SectionError";

export default function GenreDetail({ genreTitle, genreId, watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const { movies, loading, error, retry } = useMovies(
    async () => {
      const requests = Array.from({ length: page }, (_, index) =>
        fetchByGenre(genreId, index + 1)
      );
      const results = await Promise.all(requests);
      const byId = new Map();
      results.forEach((data) => {
        (data.results || []).forEach((movie) => {
          if (movie?.id && !byId.has(movie.id)) {
            byId.set(movie.id, movie);
          }
        });
      });
      return Array.from(byId.values());
    },
    [genreId, page],
    { errorMessage: `Could not load ${genreTitle}.` }
  );

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  return (
    <main className="main">
      <section className="rail-section">
        <h3>{genreTitle}</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <SectionError message={error} onRetry={retry} /> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage={`No ${genreTitle} found.`} />
        ) : null}
        <div className="popular-actions">
          <button
            type="button"
            className="row-more-btn"
            onClick={() => setPage((current) => current + 1)}
          >
            More {genreTitle}
          </button>
        </div>
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
