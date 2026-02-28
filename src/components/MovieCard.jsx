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
      className="relative w-full cursor-pointer overflow-hidden rounded-lg bg-[var(--panel)] text-left transition duration-200 hover:translate-y-[-4px] hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
      onClick={() => onClick(movie)}
      aria-label={`Open details for ${title}`}
    >
      {isPlaybackEnabled && licensed != null ? (
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-[0.65rem] font-bold text-white ${
            licensed ? "bg-emerald-500/90" : "bg-red-700/90"
          }`}
        >
          {licensed ? "Licensed" : "Not Licensed"}
        </span>
      ) : null}
      <img
        src={poster}
        alt={title}
        loading="lazy"
        className={`block h-[180px] w-full object-cover transition duration-200 md:h-[250px] ${
          imageLoaded ? "scale-100 blur-none" : "scale-[1.04] blur-[10px]"
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      <div className="p-3">
        <h3 className="mb-2 line-clamp-2 min-h-[2.35em] text-sm text-[var(--text)]">{title}</h3>
        <span className="mr-2 inline-block text-xs text-[var(--muted)]">Rating: {rating}</span>
        <span className="inline-block text-xs text-[var(--muted)]">{year}</span>
      </div>
    </button>
  );
}
