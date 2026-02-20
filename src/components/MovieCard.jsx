import { IMG_BASE } from "../api/tmdb";

export default function MovieCard({ movie, onClick }) {
  const poster = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const rating =
    typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A";
  const year = movie.release_date?.slice(0, 4) || "Unknown";
  const title = movie.title || "Untitled";

  return (
    <button
      type="button"
      className="card"
      onClick={() => onClick(movie)}
      aria-label={`Open details for ${title}`}
    >
      <img src={poster} alt={title} loading="lazy" />
      <div className="card-info">
        <h3>{title}</h3>
        <span>Rating: {rating}</span>
        <span>{year}</span>
      </div>
    </button>
  );
}
