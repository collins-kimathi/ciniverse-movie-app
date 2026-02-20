import { useEffect, useState } from "react";
import { fetchMovieDetails, fetchWatchProviders, IMG_BASE } from "../api/tmdb";

export default function MovieModal({ movie, onClose }) {
  const [details, setDetails] = useState(null);
  const [providers, setProviders] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetails(null);
      setProviders(null);
      setShowTrailer(false);
      setError("");

      try {
        // Fetch details + provider info together to reduce wait time.
        const [data, watchData] = await Promise.all([
          fetchMovieDetails(movie.id),
          fetchWatchProviders(movie.id),
        ]);
        if (!cancelled) {
          setDetails(data);
          setProviders(watchData?.results?.US || null);
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
  const flatrateNames = providers?.flatrate?.map((p) => p.provider_name) || [];
  const rentNames = providers?.rent?.map((p) => p.provider_name) || [];
  const buyNames = providers?.buy?.map((p) => p.provider_name) || [];
  const providerLink = providers?.link || "";

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
            <div className="providers">
              <h3>Where To Watch (US)</h3>
              {providerLink ? (
                <div className="provider-actions">
                  <a
                    href={providerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="provider-link-btn"
                  >
                    Open Legal Watch Options
                  </a>
                </div>
              ) : null}
              {flatrateNames.length ? (
                <div className="provider-list">
                  <strong>Streaming:</strong>
                  <div className="provider-chips">
                    {flatrateNames.map((name) => (
                      <span key={`stream-${name}`} className="provider-chip">{name}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {rentNames.length ? (
                <div className="provider-list">
                  <strong>Rent:</strong>
                  <div className="provider-chips">
                    {rentNames.map((name) => (
                      <span key={`rent-${name}`} className="provider-chip">{name}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {buyNames.length ? (
                <div className="provider-list">
                  <strong>Buy:</strong>
                  <div className="provider-chips">
                    {buyNames.map((name) => (
                      <span key={`buy-${name}`} className="provider-chip">{name}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {!flatrateNames.length && !rentNames.length && !buyNames.length ? (
                <p>No provider data available from TMDB.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
