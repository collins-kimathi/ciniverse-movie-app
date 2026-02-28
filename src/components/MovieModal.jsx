import { useEffect, useState } from "react";
import { fetchMovieDetails, fetchWatchProviders, IMG_BASE } from "../api/tmdb";
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "../api/playback";

const WATCH_REGION = (import.meta.env.VITE_WATCH_REGION || "US").toUpperCase();

export default function MovieModal({ movie, onClose }) {
  const [details, setDetails] = useState(null);
  const [providers, setProviders] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFullMovie, setShowFullMovie] = useState(false);
  const [playback, setPlayback] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetails(null);
      setProviders(null);
      setShowTrailer(false);
      setShowFullMovie(false);
      setPlayback(null);
      setPlaybackLoading(false);
      setPlaybackError("");
      setError("");

      try {
        const [data, watchData] = await Promise.all([
          fetchMovieDetails(movie.id),
          fetchWatchProviders(movie.id),
        ]);
        if (!cancelled) {
          setDetails(data);
          setProviders(watchData?.results?.[WATCH_REGION] || null);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load movie details. Please try again.");
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  useEffect(() => {
    // Let users dismiss the modal with Escape.
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            X
          </button>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <p className="status-line">Loading details...</p>
        </div>
      </div>
    );
  }

  const trailer = details.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const poster = details.poster_path
    ? `${IMG_BASE}${details.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const rating =
    typeof details.vote_average === "number" ? details.vote_average.toFixed(1) : "N/A";
  const year = details.release_date?.slice(0, 4) || "Unknown";
  const runtime = details.runtime ? `${details.runtime} min` : "Unknown runtime";
  const hasPlayback = Boolean(playback?.src);
  const flatrateNames = providers?.flatrate?.map((p) => p.provider_name) || [];
  const providerLink = providers?.link || "";

  async function onWatchFullMovie() {
    if (showFullMovie && hasPlayback) {
      setShowFullMovie(false);
      return;
    }

    if (hasPlayback) {
      setShowFullMovie(true);
      return;
    }

    setPlaybackLoading(true);
    setPlaybackError("");

    try {
      const stream = await fetchLicensedPlaybackSession(movie.id);
      if (stream) {
        setPlayback(stream);
        setShowFullMovie(true);
      } else {
        setPlaybackError(
          "No licensed full-movie stream is available for this title in your region."
        );
      }
    } catch {
      setPlaybackError("Failed to start licensed playback. Please try again.");
    } finally {
      setPlaybackLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close details">
          X
        </button>
        <div className="modal-content">
          <img src={poster} alt={details.title || "Movie poster"} />
          <div className="modal-info">
            <h2>{details.title || "Untitled"}</h2>
            {details.tagline ? <p className="tagline">{details.tagline}</p> : null}
            <p>
              Rating: {rating} | {year} | {runtime}
            </p>
            <p>{details.overview || "No overview available."}</p>
            {isPlaybackEnabled ? (
              <button
                type="button"
                className="stream-btn"
                onClick={onWatchFullMovie}
                disabled={playbackLoading}
              >
                {playbackLoading
                  ? "Loading Licensed Stream..."
                  : showFullMovie
                    ? "Hide Full Movie"
                    : "Watch Full Movie"}
              </button>
            ) : (
              <p className="status-line">
                Full-movie streaming is disabled. Add a licensed playback API to enable it.
              </p>
            )}
            {playbackError ? <p className="status-line error">{playbackError}</p> : null}
            {providerLink ? (
              <a
                href={providerLink}
                target="_blank"
                rel="noreferrer"
                className="provider-link-btn"
              >
                Watch on Licensed Provider
              </a>
            ) : (
              <p className="status-line">
                No licensed provider link found for {WATCH_REGION} in TMDb data.
              </p>
            )}
            {flatrateNames.length ? (
              <p className="status-line">Streaming on: {flatrateNames.join(", ")}</p>
            ) : null}
            {showFullMovie && hasPlayback ? (
              <div className="full-player-wrap">
                {playback.type === "iframe" ? (
                  <iframe
                    title={`${details.title || "Movie"} full movie`}
                    src={playback.src}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls poster={playback.poster}>
                    <source
                      src={playback.src}
                      type={
                        playback.type === "hls"
                          ? "application/x-mpegURL"
                          : playback.type === "dash"
                            ? "application/dash+xml"
                            : "video/mp4"
                      }
                    />
                    Your browser does not support the video tag.
                  </video>
                )}
                <p className="license-note">
                  Source: {playback.provider} ({playback.region})
                </p>
              </div>
            ) : null}
            {trailer ? (
              <button
                type="button"
                className="trailer-btn"
                onClick={() => setShowTrailer((prev) => !prev)}
              >
                {showTrailer ? "Hide Trailer" : "Watch Trailer Here"}
              </button>
            ) : null}
            {showTrailer && trailer ? (
              <div className="trailer-frame-wrap">
                <iframe
                  title={`${details.title || "Movie"} trailer`}
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
