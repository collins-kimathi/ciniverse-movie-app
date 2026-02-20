import { useState } from "react";
import { fetchPopular } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import useMovies from "../hooks/useMovies";

export default function Popular() {
  const [selected, setSelected] = useState(null);
  const { movies, loading, error } = useMovies(
    async () => {
      const data = await fetchPopular(1);
      return data.results || [];
    },
    [],
    { errorMessage: "Could not load popular movies." }
  );

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Popular Movies</h3>
        {loading ? <p className="status-line">Loading movies...</p> : null}
        {error ? <p className="status-line error">{error}</p> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No popular movies found." />
        ) : null}
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
