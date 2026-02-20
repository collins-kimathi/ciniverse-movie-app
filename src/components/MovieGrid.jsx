import MovieCard from "./MovieCard";

export default function MovieGrid({
  movies = [],
  onSelect = () => {},
  limit,
  emptyMessage = "No movies to show.",
}) {
  const safeMovies = movies.filter((movie) => movie && movie.id);
  const visibleMovies = limit != null ? safeMovies.slice(0, limit) : safeMovies;

  if (!visibleMovies.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="grid">
      {visibleMovies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onClick={onSelect} />
      ))}
    </div>
  );
}
