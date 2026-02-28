import { useEffect, useState } from "react";
import { fetchPopular } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import SectionError from "../components/SectionError";
import useMovies from "../hooks/useMovies";

export default function Popular({ watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const { movies, loading, error, retry } = useMovies(
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

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  return (
    <main className="px-3 pb-7 pt-4 md:px-10 md:pb-10 md:pt-6">
      <section className="mb-8">
        <h3 className="mb-4 text-xl">Popular Movies</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <SectionError message={error} onRetry={retry} /> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No popular movies found." />
        ) : null}
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18"
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
