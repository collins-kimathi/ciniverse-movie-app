import { useState } from "react";
import { fetchAnime } from "../api/tmdb";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import SkeletonGrid from "../components/SkeletonGrid";
import useMovies from "../hooks/useMovies";

export default function Anime() {
  const [selected, setSelected] = useState(null);
  const { movies, loading, error } = useMovies(
    async () => {
      const [page1, page2] = await Promise.all([fetchAnime(1), fetchAnime(2)]);
      const uniqueById = new Map();

      [...(page1.results || []), ...(page2.results || [])].forEach((movie) => {
        if (movie?.id && !uniqueById.has(movie.id)) {
          uniqueById.set(movie.id, movie);
        }
      });

      return Array.from(uniqueById.values());
    },
    [],
    { errorMessage: "Could not load anime movies." }
  );

  return (
    <main className="main">
      <section className="rail-section">
        <h3>Anime Movies</h3>
        {loading ? <SkeletonGrid count={12} /> : null}
        {error ? <p className="status-line error">{error}</p> : null}
        {!loading && !error ? (
          <MovieGrid movies={movies} onSelect={setSelected} emptyMessage="No anime movies found." />
        ) : null}
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
