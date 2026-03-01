import { useEffect, useMemo, useState } from "react";
import { searchMovies } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import SectionError from "../components/SectionError";
import useMovies from "../hooks/useMovies";
import { trackEvent } from "../utils/analytics";

export default function Search({ query, watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [selected, setSelected] = useState(null);
  const cleanQuery = useMemo(() => query.trim(), [query]);

  const { movies: results, loading, error, retry } = useMovies(
    async () => {
      const data = await searchMovies(cleanQuery);
      return data.results || [];
    },
    [cleanQuery],
    {
      enabled: Boolean(cleanQuery),
      errorMessage: "Search failed. Please try again.",
    }
  );

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  useEffect(() => {
    if (!cleanQuery || loading || error) {
      return;
    }
    trackEvent("search_results_loaded", {
      query: cleanQuery,
      count: results.length,
    });
  }, [cleanQuery, loading, error, results.length]);

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Results for "{query}"</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <SectionError message={error} onRetry={retry} /> : null}
        {!loading && !error ? (
          <MovieGrid movies={results} onSelect={setSelected} emptyMessage="No movies matched your search." />
        ) : null}
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
