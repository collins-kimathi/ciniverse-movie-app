import { useEffect, useState } from "react";
import { IMG_BASE } from "../api/tmdb";
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "../api/playback";

const availabilityCache = new Map();

export default function MovieCard({ movie, onClick }) {
  const poster = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const rating =
    typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A";
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) || "Unknown";
  const title = movie.title || movie.name || "Untitled";
  const [licensed, setLicensed] = useState(availabilityCache.get(movie.id));
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [movie.id, movie.poster_path]);

  useEffect(() => {
    let cancelled = false;
    if (!isPlaybackEnabled) {
      return undefined;
    }
    if (availabilityCache.has(movie.id)) {
      setLicensed(availabilityCache.get(movie.id));
      return undefined;
    }
    fetchLicensedPlaybackSession(movie.id)
      .then((stream) => {
        const isLicensed = Boolean(stream?.src);
        availabilityCache.set(movie.id, isLicensed);
        if (!cancelled) {
          setLicensed(isLicensed);
        }
      })
      .catch(() => {
        availabilityCache.set(movie.id, false);
        if (!cancelled) {
          setLicensed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  return (
    <button
      type="button"
      className="card"
      onClick={() => onClick(movie)}
      aria-label={`Open details for ${title}`}
    >
      {isPlaybackEnabled && licensed != null ? (
        <span className={`availability-badge ${licensed ? "yes" : "no"}`}>
          {licensed ? "Licensed" : "Not Licensed"}
        </span>
      ) : null}
      <img
        src={poster}
        alt={title}
        loading="lazy"
        className={imageLoaded ? "loaded" : "loading"}
        onLoad={() => setImageLoaded(true)}
      />
      <div className="card-info">
        <h3>{title}</h3>
        <span>Rating: {rating}</span>
        <span>{year}</span>
      </div>
    </button>
  );
}
