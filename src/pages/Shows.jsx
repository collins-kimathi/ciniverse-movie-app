// Page component for the Shows view and its data wiring.
import { useEffect, useState } from "react";
import { fetchPopularShows } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import SectionError from "../components/SectionError";
import useMovies from "../hooks/useMovies";

export default function Shows({ watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const { movies, loading, error, retry } = useMovies(
    async () => {
      const requests = Array.from({ length: page }, (_, index) =>
        fetchPopularShows(index + 1)
      );
      const results = await Promise.all(requests);
      const uniqueById = new Map();

      results.forEach((data) => {
        (data.results || []).forEach((show) => {
          if (show?.id && !uniqueById.has(show.id)) {
            uniqueById.set(show.id, { ...show, mediaType: "tv" });
          }
        });
      });

      return Array.from(uniqueById.values());
    },
    [page],
    { errorMessage: "Could not load shows." }
  );

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType || "tv" });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Popular Shows</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <SectionError message={error} onRetry={retry} /> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No shows found." />
        ) : null}
        <div className="popular-actions">
          <button
            type="button"
            className="row-more-btn"
            onClick={() => setPage((current) => current + 1)}
            aria-label="Load more shows"
            title="Load more shows"
          >
            More Shows +
          </button>
        </div>
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
