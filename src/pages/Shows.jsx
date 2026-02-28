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
    <main className="px-3 pb-7 pt-4 md:px-10 md:pb-10 md:pt-6">
      <section className="mb-8">
        <h3 className="mb-4 text-xl">Popular Shows</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <SectionError message={error} onRetry={retry} /> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No shows found." />
        ) : null}
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18"
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
