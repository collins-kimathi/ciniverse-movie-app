import { useMemo, useState } from "react";
import { searchMovies } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import useMovies from "../hooks/useMovies";

export default function Search({ query }) {
  const [selected, setSelected] = useState(null);
  const cleanQuery = useMemo(() => query.trim(), [query]);

  const { movies: results, loading, error } = useMovies(
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

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Results for "{query}"</h3>
        {loading ? <p className="status-line">Searching...</p> : null}
        {error ? <p className="status-line error">{error}</p> : null}
        {!loading && !error ? (
          <MovieGrid movies={results} onSelect={setSelected} emptyMessage="No movies matched your search." />
        ) : null}
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
